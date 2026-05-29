import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';
import { AmenitiesController } from './controllers/amenities.controller';
import { AmenitiesService } from './services/amenities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [TypeOrmModule, AmenitiesService],
})
export class AmenitiesModule {}
