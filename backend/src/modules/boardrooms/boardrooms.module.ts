import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from '../amenities/entities/amenity.entity';
import { BoardroomsService } from './services/boardrooms.service';
import { BoardroomsController } from './controllers/boardrooms.controller';
import { Boardroom } from './entities/boardroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boardroom, Amenity])],
  providers: [BoardroomsService],
  controllers: [BoardroomsController],
  exports: [TypeOrmModule, BoardroomsService],
})
export class BoardroomsModule {}
