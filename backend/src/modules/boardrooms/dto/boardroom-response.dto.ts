import { ApiProperty } from '@nestjs/swagger';
import { AmenityResponseDto } from '../../amenities/dto/amenity-response.dto';

export class BoardroomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Maple Boardroom' })
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 12 })
  capacity: number;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [AmenityResponseDto] })
  amenities: AmenityResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
