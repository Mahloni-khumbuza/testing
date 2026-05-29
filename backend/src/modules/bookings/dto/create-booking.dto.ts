import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Q2 Strategy Review' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Boardroom UUID' })
  @IsUUID('4')
  boardroomId: string;

  @ApiProperty({ description: 'ISO 8601 start time' })
  @IsISO8601()
  startTime: string;

  @ApiProperty({ description: 'ISO 8601 end time' })
  @IsISO8601()
  endTime: string;
}
