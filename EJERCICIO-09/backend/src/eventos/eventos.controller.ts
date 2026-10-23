import { BadRequestException, Controller, Get, PipeTransform, Query } from '@nestjs/common';
import { EventosService } from './eventos.service';

class FiltroTextoPipe implements PipeTransform<unknown, string | undefined> {
  transform(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.trim().length > 120) {
      throw new BadRequestException('Cada filtro debe ser un único texto de hasta 120 caracteres.');
    }
    return value.trim() || undefined;
  }
}

@Controller('eventos')
export class EventosController {
  constructor(private readonly service: EventosService) {}

  // GET /eventos?ciudad=Zaragoza&categoria=Tecnologia
  @Get()
  findAll(
    @Query('ciudad', new FiltroTextoPipe()) ciudad?: string,
    @Query('categoria', new FiltroTextoPipe()) categoria?: string,
  ) {
    return this.service.findAll(ciudad, categoria);
  }
}
