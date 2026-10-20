// peliculas.module.ts
// RESPONSABILIDAD: registrar Pelicula y agrupar Controller + Service.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pelicula } from './pelicula.entity';
import { PeliculasController } from './peliculas.controller';
import { PeliculasService } from './peliculas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pelicula])],
  controllers: [PeliculasController],
  providers: [PeliculasService],
})
export class PeliculasModule {}