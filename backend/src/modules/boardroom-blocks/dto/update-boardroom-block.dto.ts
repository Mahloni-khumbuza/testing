import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBoardroomBlockDto } from './create-boardroom-block.dto';

export class UpdateBoardroomBlockDto extends PartialType(
  OmitType(CreateBoardroomBlockDto, ['boardroomId'] as const),
) {}
