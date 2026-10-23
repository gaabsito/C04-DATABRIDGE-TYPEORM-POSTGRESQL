import { Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { Libro } from './libro.entity';
import { LibrosService } from './libros.service';

@Controller('libros')
export class LibrosController {
 constructor(private readonly service:LibrosService){}

 @Get()
 findAll():Promise<Libro[]>{ return this.service.findAll(); }

 @Delete(':id')
 @HttpCode(204)
 remove(@Param('id',ParseIntPipe) id:number):Promise<void>{
   return this.service.remove(id);
 }

 @Patch(':id/leido')
 marcarLeido(@Param('id',ParseIntPipe) id:number):Promise<void>{
   return this.service.marcarLeido(id);
 }
}