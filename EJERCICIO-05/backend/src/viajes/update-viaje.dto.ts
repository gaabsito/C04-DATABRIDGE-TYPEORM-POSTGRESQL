import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// PATCH admite solo los campos que se quieren cambiar, incluida fecha.
export class UpdateViajeDto {
  destino?: string;
  pais?: string;
  estado?: string;
  fecha?: string;
}

@Injectable()
export class UpdateViajePipe implements PipeTransform<unknown, UpdateViajeDto> {
  transform(value: unknown): UpdateViajeDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Envía un objeto JSON con los cambios.');
    }
    const body = value as Record<string, unknown>;
    const cambios: UpdateViajeDto = {};
    for (const campo of ['destino', 'pais', 'estado', 'fecha'] as const) {
      if (!Object.prototype.hasOwnProperty.call(body, campo)) continue;
      const dato = body[campo];
      if (typeof dato !== 'string' || !dato.trim() || dato.trim().length > 120) {
        throw new BadRequestException(`${campo} debe tener entre 1 y 120 caracteres.`);
      }
      cambios[campo] = dato.trim();
    }
    if (cambios.fecha !== undefined) {
      const fecha = cambios.fecha;
      const timestamp = Date.parse(fecha + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(timestamp) ||
          new Date(timestamp).toISOString().slice(0, 10) !== fecha) {
        throw new BadRequestException('fecha debe ser una fecha real con formato AAAA-MM-DD.');
      }
    }
    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('Envía al menos uno: destino, pais, estado o fecha.');
    }
    // Los campos ausentes no reciben valores por defecto ni borran datos.
    return cambios;
  }
}
