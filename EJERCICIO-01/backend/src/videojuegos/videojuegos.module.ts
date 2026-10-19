// videojuegos.module.ts
// RESPONSABILIDAD:
// Agrupar Entity, Controller y Service del dominio videojuegos.

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Videojuego } from './videojuego.entity';
import { VideojuegosController } from './videojuegos.controller';
import { VideojuegosService } from './videojuegos.service';

@Module({
  // forFeature() permite utilizar Repository<Videojuego>
  // dentro de este módulo.
  imports: [TypeOrmModule.forFeature([Videojuego])],

  controllers: [VideojuegosController],
  providers: [VideojuegosService],
})
export class VideojuegosModule {}