import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  findAll(): Promise<SystemSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async findOne(id: string): Promise<SystemSetting> {
    const setting = await this.repo.findOne({ where: { id } });
    if (!setting) {
      throw new NotFoundException(`Setting ${id} not found`);
    }
    return setting;
  }

  findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async create(dto: CreateSystemSettingDto): Promise<SystemSetting> {
    const clash = await this.repo.findOne({ where: { key: dto.key } });
    if (clash) {
      throw new ConflictException(`Setting "${dto.key}" already exists`);
    }
    const setting = this.repo.create({
      key: dto.key,
      value: dto.value ?? null,
      description: dto.description ?? null,
    });
    return this.repo.save(setting);
  }

  async update(id: string, dto: UpdateSystemSettingDto): Promise<SystemSetting> {
    const setting = await this.findOne(id);
    if (dto.value !== undefined) setting.value = dto.value;
    if (dto.description !== undefined) setting.description = dto.description;
    return this.repo.save(setting);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Setting ${id} not found`);
    }
  }
}
