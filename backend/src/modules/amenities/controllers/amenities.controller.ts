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
import { CreateAmenityDto } from '../dto/create-amenity.dto';
import { AmenityResponseDto } from '../dto/amenity-response.dto';
import { UpdateAmenityDto } from '../dto/update-amenity.dto';
import { Amenity } from '../entities/amenity.entity';
import { AmenitiesService } from '../services/amenities.service';

@ApiTags('amenities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @Permissions('amenities:read')
  @ApiOkResponse({ type: [AmenityResponseDto] })
  findAll(): Promise<Amenity[]> {
    return this.amenitiesService.findAll();
  }

  @Get(':id')
  @Permissions('amenities:read')
  @ApiOkResponse({ type: AmenityResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Amenity> {
    return this.amenitiesService.findOne(id);
  }

  @Post()
  @Permissions('amenities:write')
  @ApiCreatedResponse({ type: AmenityResponseDto })
  create(@Body() dto: CreateAmenityDto): Promise<Amenity> {
    return this.amenitiesService.create(dto);
  }

  @Patch(':id')
  @Permissions('amenities:write')
  @ApiOkResponse({ type: AmenityResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAmenityDto,
  ): Promise<Amenity> {
    return this.amenitiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('amenities:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.amenitiesService.remove(id);
  }
}
