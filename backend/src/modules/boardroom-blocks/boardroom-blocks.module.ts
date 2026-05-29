import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boardroom } from '../boardrooms/entities/boardroom.entity';
import { BoardroomBlock } from './entities/boardroom-block.entity';
import { BoardroomBlocksController } from './controllers/boardroom-blocks.controller';
import { BoardroomBlocksService } from './services/boardroom-blocks.service';

@Module({
  imports: [TypeOrmModule.forFeature([BoardroomBlock, Boardroom])],
  controllers: [BoardroomBlocksController],
  providers: [BoardroomBlocksService],
  exports: [TypeOrmModule, BoardroomBlocksService],
})
export class BoardroomBlocksModule {}
