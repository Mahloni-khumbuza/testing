import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { Boardroom } from '../../boardrooms/entities/boardroom.entity';
import { BoardroomBlocksService } from '../../boardroom-blocks/services/boardroom-blocks.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { BookingQueryDto } from '../dto/booking-query.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

const ADMIN_ROLES = new Set(['SuperAdmin', 'Admin', 'Manager']);
const ACTIVE_STATUSES = [BookingStatus.Pending, BookingStatus.Confirmed];

export interface ActorContext {
  id: string;
  role: string | null;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    @InjectRepository(Boardroom)
    private readonly boardroomsRepo: Repository<Boardroom>,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BoardroomBlocksService,
  ) {}

  async findAll(query: BookingQueryDto, actor: ActorContext): Promise<Booking[]> {
    const where: Record<string, unknown> = {};

    if (query.status) where['status'] = query.status;
    if (query.boardroomId) where['boardroomId'] = query.boardroomId;
    if (query.bookedById) where['bookedById'] = query.bookedById;
    if (query.mine) where['bookedById'] = actor.id;
    if (!this.isAdmin(actor) && !query.mine && !query.bookedById) {
      where['bookedById'] = actor.id;
    }
    if (query.from && query.to) {
      where['startTime'] = Between(new Date(query.from), new Date(query.to));
    } else if (query.from) {
      where['endTime'] = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where['startTime'] = LessThanOrEqual(new Date(query.to));
    }

    return this.repo.find({
      where,
      relations: { boardroom: true, bookedBy: true },
      order: { startTime: 'ASC' },
      take: 500,
    });
  }

  async findOne(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }
    if (!this.isAdmin(actor) && booking.bookedById !== actor.id) {
      throw new ForbiddenException('You can only view your own bookings');
    }
    return booking;
  }

  async create(dto: CreateBookingDto, actor: ActorContext): Promise<Booking> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const boardroom = await this.boardroomsRepo.findOne({ where: { id: dto.boardroomId } });
    if (!boardroom) {
      throw new BadRequestException(`Boardroom ${dto.boardroomId} not found`);
    }
    if (!boardroom.isActive) {
      throw new BadRequestException(`Boardroom "${boardroom.name}" is not active`);
    }

    await this.assertNoConflict(boardroom.id, start, end);

    const initialStatus = this.isAdmin(actor)
      ? BookingStatus.Confirmed
      : BookingStatus.Pending;

    const booking = this.repo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      startTime: start,
      endTime: end,
      status: initialStatus,
      boardroomId: boardroom.id,
      bookedById: actor.id,
    });
    const saved = await this.repo.save(booking);

    await this.auditLogs.record({
      action: 'booking.created',
      entity: 'booking',
      entityId: saved.id,
      actorId: actor.id,
      metadata: { title: saved.title, status: saved.status, boardroomId: boardroom.id },
    });

    await this.notifications.notify({
      recipientId: actor.id,
      type: NotificationType.BookingCreated,
      title:
        initialStatus === BookingStatus.Pending ? 'Booking submitted' : 'Booking confirmed',
      message:
        initialStatus === BookingStatus.Pending
          ? `Your booking for "${boardroom.name}" is awaiting approval.`
          : `Your booking for "${boardroom.name}" is confirmed.`,
    });

    return this.reload(saved.id);
  }

  async update(id: string, dto: UpdateBookingDto, actor: ActorContext): Promise<Booking> {
    const booking = await this.findOne(id, actor);
    if (booking.status === BookingStatus.Cancelled) {
      throw new BadRequestException('Cannot edit a cancelled booking');
    }

    const start = dto.startTime ? new Date(dto.startTime) : booking.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : booking.endTime;
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }

    if (dto.startTime || dto.endTime) {
      await this.assertNoConflict(booking.boardroomId, start, end, booking.id);
    }

    if (dto.title !== undefined) booking.title = dto.title.trim();
    if (dto.description !== undefined) booking.description = dto.description?.trim() || null;
    booking.startTime = start;
    booking.endTime = end;

    const saved = await this.repo.save(booking);
    await this.auditLogs.record({
      action: 'booking.updated',
      entity: 'booking',
      entityId: saved.id,
      actorId: actor.id,
    });
    return this.reload(saved.id);
  }

  async approve(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (booking.status !== BookingStatus.Pending) {
      throw new BadRequestException(`Booking is not pending (status: ${booking.status})`);
    }
    booking.status = BookingStatus.Confirmed;
    const saved = await this.repo.save(booking);

    await this.auditLogs.record({
      action: 'booking.approved',
      entity: 'booking',
      entityId: saved.id,
      actorId: actor.id,
    });

    if (booking.bookedById) {
      await this.notifications.notify({
        recipientId: booking.bookedById,
        type: NotificationType.BookingCreated,
        title: 'Booking approved',
        message: `Your booking "${saved.title}" has been approved.`,
      });
    }

    return this.reload(saved.id);
  }

  async cancel(id: string, actor: ActorContext): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    if (!this.isAdmin(actor) && booking.bookedById !== actor.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status === BookingStatus.Cancelled) {
      throw new BadRequestException('Booking is already cancelled');
    }

    booking.status = BookingStatus.Cancelled;
    const saved = await this.repo.save(booking);

    await this.auditLogs.record({
      action: 'booking.cancelled',
      entity: 'booking',
      entityId: saved.id,
      actorId: actor.id,
    });

    if (booking.bookedById && booking.bookedById !== actor.id) {
      await this.notifications.notify({
        recipientId: booking.bookedById,
        type: NotificationType.BookingCancelled,
        title: 'Booking cancelled',
        message: `Your booking "${saved.title}" was cancelled by an administrator.`,
      });
    }

    return this.reload(saved.id);
  }

  async remove(id: string, actor: ActorContext): Promise<void> {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    await this.repo.delete(id);
    await this.auditLogs.record({
      action: 'booking.deleted',
      entity: 'booking',
      entityId: id,
      actorId: actor.id,
      metadata: { title: booking.title },
    });
  }

  private async assertNoConflict(
    boardroomId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<void> {
    const block = await this.blocks.findOverlapping(boardroomId, start, end);
    if (block) {
      throw new ConflictException(
        `Boardroom is blocked (${block.reason}) from ${block.startTime.toISOString()} to ${block.endTime.toISOString()}`,
      );
    }

    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.boardroomId = :boardroomId', { boardroomId })
      .andWhere('b.status IN (:...statuses)', { statuses: ACTIVE_STATUSES })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start, end });
    if (excludeId) {
      qb.andWhere('b.id != :excludeId', { excludeId });
    }
    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        `Booking conflicts with existing booking "${conflict.title}" from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
      );
    }
  }

  private async reload(id: string): Promise<Booking> {
    const fresh = await this.repo.findOne({
      where: { id },
      relations: { boardroom: true, bookedBy: true },
    });
    if (!fresh) throw new NotFoundException(`Booking ${id} disappeared`);
    return fresh;
  }

  private isAdmin(actor: ActorContext): boolean {
    return actor.role !== null && ADMIN_ROLES.has(actor.role);
  }
}
