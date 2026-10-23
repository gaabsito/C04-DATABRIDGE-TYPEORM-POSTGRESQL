import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destino } from './destino.entity';
import { DestinosController } from './destinos.controller';
import { DestinosService } from './destinos.service';
@Module({imports:[TypeOrmModule.forFeature([Destino])],controllers:[DestinosController],providers:[DestinosService]})
export class DestinosModule {}