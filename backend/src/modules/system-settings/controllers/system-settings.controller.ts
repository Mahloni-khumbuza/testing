import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { CreateSystemSettingDto } from '../dto/create-system-setting.dto';
import { SystemSettingResponseDto } from '../dto/system-setting-response.dto';
import { UpdateSystemSettingDto } from '../dto/update-system-setting.dto';
import { SystemSetting } from '../entities/system-setting.entity';
import { SystemSettingsService } from '../services/system-settings.service';

@ApiTags('system-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  @Permissions('settings:read')
  @ApiOkResponse({ type: [SystemSettingResponseDto] })
  findAll(): Promise<SystemSetting[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('settings:read')
  @ApiOkResponse({ type: SystemSettingResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<SystemSetting> {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('settings:write')
  @ApiCreatedResponse({ type: SystemSettingResponseDto })
  create(@Body() dto: CreateSystemSettingDto): Promise<SystemSetting> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('settings:write')
  @ApiOkResponse({ type: SystemSettingResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('settings:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
