import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './evento.entity';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
@Module({imports:[TypeOrmModule.forFeature([Evento])],controllers:[EventosController],providers:[EventosService]})
export class EventosModule {}