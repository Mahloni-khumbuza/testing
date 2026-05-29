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
  Req,
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
import { BoardroomBlock } from '../entities/boardroom-block.entity';
import { BoardroomBlockQueryDto } from '../dto/boardroom-block-query.dto';
import { BoardroomBlockResponseDto } from '../dto/boardroom-block-response.dto';
import { CreateBoardroomBlockDto } from '../dto/create-boardroom-block.dto';
import { UpdateBoardroomBlockDto } from '../dto/update-boardroom-block.dto';
import { BoardroomBlocksService } from '../services/boardroom-blocks.service';

interface AuthedRequest {
  user: { sub: string };
}

@ApiTags('boardroom-blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('boardroom-blocks')
export class BoardroomBlocksController {
  constructor(private readonly service: BoardroomBlocksService) {}

  @Get()
  @Permissions('boardroom-blocks:read')
  @ApiOkResponse({ type: [BoardroomBlockResponseDto] })
  findAll(@Query() query: BoardroomBlockQueryDto): Promise<BoardroomBlock[]> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('boardroom-blocks:read')
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<BoardroomBlock> {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('boardroom-blocks:write')
  @ApiCreatedResponse({ type: BoardroomBlockResponseDto })
  create(
    @Body() dto: CreateBoardroomBlockDto,
    @Req() req: AuthedRequest,
  ): Promise<BoardroomBlock> {
    return this.service.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Permissions('boardroom-blocks:write')
  @ApiOkResponse({ type: BoardroomBlockResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoardroomBlockDto,
  ): Promise<BoardroomBlock> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('boardroom-blocks:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
