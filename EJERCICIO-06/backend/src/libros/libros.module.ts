import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from './libro.entity';
import { BibliotecaEstado } from './biblioteca-estado.entity';
import { LibrosController } from './libros.controller';
import { LibrosService } from './libros.service';
@Module({imports:[TypeOrmModule.forFeature([Libro, BibliotecaEstado])],controllers:[LibrosController],providers:[LibrosService]})
export class LibrosModule {}