import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Viaje } from './viaje.entity';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';
@Module({imports:[TypeOrmModule.forFeature([Viaje])],controllers:[ViajesController],providers:[ViajesService]})
export class ViajesModule {}