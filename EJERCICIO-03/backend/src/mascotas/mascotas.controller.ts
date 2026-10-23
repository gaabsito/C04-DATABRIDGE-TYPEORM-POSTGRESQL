// mascotas.controller.ts
// RESPONSABILIDAD: leer el Path Param :id y delegar en Service.
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Mascota } from './mascota.entity';
import { MascotasService } from './mascotas.service';

@Controller('mascotas')
export class MascotasController {
  constructor(private readonly service: MascotasService) {}

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Mascota> {
    return this.service.findOne(id);
  }
}