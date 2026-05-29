import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuditLogsService } from '../../audit-logs/services/audit-logs.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
      relations: { role: { permissions: true } },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: { role: { permissions: true } },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async createFromDto(dto: CreateUserDto, actorId?: string): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User "${dto.email}" already exists`);
    }
    const role = await this.resolveRole(dto.roleId);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      isActive: dto.isActive ?? true,
      role: role ?? null,
    });
    const saved = await this.usersRepository.save(user);

    await this.auditLogs.record({
      action: 'user.created',
      entity: 'user',
      entityId: saved.id,
      actorId,
      metadata: { email: saved.email, role: role?.name ?? null },
    });

    await this.notifications.notify({
      recipientId: saved.id,
      title: 'Welcome to Boardroom Booking',
      message: `Your account has been created with the role ${role?.name ?? 'unassigned'}. Sign in to get started.`,
    });

    return saved;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<User> {
    const user = await this.findByIdOrFail(id);
    const changes: Record<string, unknown> = {};

    if (dto.email !== undefined && dto.email !== user.email) {
      const clash = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (clash && clash.id !== id) {
        throw new ConflictException(`User "${dto.email}" already exists`);
      }
      changes['email'] = { from: user.email, to: dto.email };
      user.email = dto.email;
    }
    if (dto.firstName !== undefined && dto.firstName !== user.firstName) {
      changes['firstName'] = { from: user.firstName, to: dto.firstName };
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined && dto.lastName !== user.lastName) {
      changes['lastName'] = { from: user.lastName, to: dto.lastName };
      user.lastName = dto.lastName;
    }
    if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
      changes['isActive'] = { from: user.isActive, to: dto.isActive };
      user.isActive = dto.isActive;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      changes['password'] = 'changed';
    }
    if (dto.roleId !== undefined) {
      const role = await this.resolveRole(dto.roleId);
      if ((user.role?.id ?? null) !== (role?.id ?? null)) {
        changes['role'] = { from: user.role?.name ?? null, to: role?.name ?? null };
        user.role = role ?? null;
        user.roleId = role?.id ?? null;
      }
    }

    const saved = await this.usersRepository.save(user);

    if (Object.keys(changes).length > 0) {
      await this.auditLogs.record({
        action: 'user.updated',
        entity: 'user',
        entityId: saved.id,
        actorId,
        metadata: { changes },
      });
    }

    return saved;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    const user = await this.findById(id);
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await this.auditLogs.record({
      action: 'user.deleted',
      entity: 'user',
      entityId: id,
      actorId,
      metadata: { email: user?.email ?? null },
    });
  }

  sanitize(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  private async resolveRole(roleId: string | undefined): Promise<Role | null> {
    if (!roleId) {
      return null;
    }
    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
      relations: { permissions: true },
    });
    if (!role) {
      throw new BadRequestException(`Unknown role id: ${roleId}`);
    }
    return role;
  }
}
