import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Prioridad } from './prioridad';

export class CreateDestinoDto {
  ciudad: string;
  pais: string;
  descripcion: string;
  prioridad?: Prioridad;
}

export function validarDestino(value: unknown, parcial: boolean): Partial<CreateDestinoDto> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Envía un objeto JSON con los datos del destino.');
  }
  const body = value as Record<string, unknown>;
  const resultado: Partial<CreateDestinoDto> = {};
  for (const campo of ['ciudad', 'pais', 'descripcion'] as const) {
    if (parcial && !Object.prototype.hasOwnProperty.call(body, campo)) continue;
    const dato = body[campo];
    const maximo = campo === 'descripcion' ? 1000 : 120;
    if (typeof dato !== 'string' || !dato.trim() || dato.trim().length > maximo) {
      throw new BadRequestException(`${campo} debe tener entre 1 y ${maximo} caracteres.`);
    }
    resultado[campo] = dato.trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, 'prioridad')) {
    const dato = body.prioridad;
    if (dato !== Prioridad.ALTA && dato !== Prioridad.MEDIA && dato !== Prioridad.BAJA) {
      throw new BadRequestException('prioridad debe ser ALTA, MEDIA o BAJA.');
    }
    resultado.prioridad = dato;
  } else if (!parcial) {
    resultado.prioridad = Prioridad.MEDIA;
  }
  if (!Object.keys(resultado).length) {
    throw new BadRequestException('Envía al menos un cambio válido.');
  }
  return resultado;
}

@Injectable()
export class CreateDestinoPipe implements PipeTransform<unknown, CreateDestinoDto> {
  transform(value: unknown): CreateDestinoDto {
    return validarDestino(value, false) as CreateDestinoDto;
  }
}
