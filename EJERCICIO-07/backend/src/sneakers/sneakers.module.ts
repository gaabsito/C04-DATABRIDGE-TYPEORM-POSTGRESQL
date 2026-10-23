import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sneaker } from './sneaker.entity';
import { SneakersController } from './sneakers.controller';
import { SneakersService } from './sneakers.service';
@Module({imports:[TypeOrmModule.forFeature([Sneaker])],controllers:[SneakersController],providers:[SneakersService]})
export class SneakersModule {}