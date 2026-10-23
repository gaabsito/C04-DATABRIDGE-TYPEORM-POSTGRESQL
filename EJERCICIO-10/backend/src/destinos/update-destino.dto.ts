import { Injectable, PipeTransform } from '@nestjs/common';
import { Prioridad } from './prioridad';
import { validarDestino } from './create-destino.dto';

export class UpdateDestinoDto {
  ciudad?: string;
  pais?: string;
  descripcion?: string;
  prioridad?: Prioridad;
}

@Injectable()
export class UpdateDestinoPipe implements PipeTransform<unknown, UpdateDestinoDto> {
  transform(value: unknown): UpdateDestinoDto {
    return validarDestino(value, true);
  }
}
