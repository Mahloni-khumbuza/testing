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
  Query,
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
import { BoardroomQueryDto } from '../dto/boardroom-query.dto';
import { BoardroomResponseDto } from '../dto/boardroom-response.dto';
import { CreateBoardroomDto } from '../dto/create-boardroom.dto';
import { UpdateBoardroomDto } from '../dto/update-boardroom.dto';
import { Boardroom } from '../entities/boardroom.entity';
import { BoardroomsService } from '../services/boardrooms.service';

@ApiTags('boardrooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boardrooms')
export class BoardroomsController {
  constructor(private readonly boardroomsService: BoardroomsService) {}

  @Get()
  @Permissions('boardrooms:read')
  @ApiOkResponse({ type: [BoardroomResponseDto] })
  findAll(@Query() query: BoardroomQueryDto): Promise<Boardroom[]> {
    return this.boardroomsService.findAll(query);
  }

  @Get(':id')
  @Permissions('boardrooms:read')
  @ApiOkResponse({ type: BoardroomResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Boardroom> {
    return this.boardroomsService.findOne(id);
  }

  @Post()
  @Permissions('boardrooms:write')
  @ApiCreatedResponse({ type: BoardroomResponseDto })
  create(@Body() dto: CreateBoardroomDto): Promise<Boardroom> {
    return this.boardroomsService.create(dto);
  }

  @Patch(':id')
  @Permissions('boardrooms:write')
  @ApiOkResponse({ type: BoardroomResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomDto,
  ): Promise<Boardroom> {
    return this.boardroomsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('boardrooms:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.boardroomsService.remove(id);
  }
}
