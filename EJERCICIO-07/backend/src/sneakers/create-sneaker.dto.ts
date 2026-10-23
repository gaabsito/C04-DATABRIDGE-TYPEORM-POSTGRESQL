import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export class CreateSneakerDto {
  marca: string;
  modelo: string;
  precio: number;
  talla: number;
  stock: number;
}

export function validarSneaker(value: unknown, parcial: boolean): Partial<CreateSneakerDto> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Envía un objeto JSON con los datos de la sneaker.');
  }
  const body = value as Record<string, unknown>;
  const resultado: Partial<CreateSneakerDto> = {};
  for (const campo of ['marca', 'modelo'] as const) {
    if (parcial && !Object.prototype.hasOwnProperty.call(body, campo)) continue;
    const dato = body[campo];
    if (typeof dato !== 'string' || !dato.trim() || dato.trim().length > 120) {
      throw new BadRequestException(`${campo} debe tener entre 1 y 120 caracteres.`);
    }
    resultado[campo] = dato.trim();
  }
  for (const campo of ['precio', 'talla', 'stock'] as const) {
    if (parcial && !Object.prototype.hasOwnProperty.call(body, campo)) continue;
    const dato = body[campo];
    const minimo = campo === 'talla' ? 1 : 0;
    const maximo = campo === 'precio' ? 9999.99 : campo === 'talla' ? 100 : 2147483647;
    if (typeof dato !== 'number' || !Number.isFinite(dato) || dato < minimo || dato > maximo ||
        (campo !== 'precio' && !Number.isInteger(dato))) {
      throw new BadRequestException(`${campo} debe ser ${campo === 'precio' ? 'un número' : 'un entero'} entre ${minimo} y ${maximo}.`);
    }
    resultado[campo] = dato;
  }
  if (!Object.keys(resultado).length) {
    throw new BadRequestException('Envía al menos un campo válido para actualizar.');
  }
  return resultado;
}

@Injectable()
export class CreateSneakerPipe implements PipeTransform<unknown, CreateSneakerDto> {
  transform(value: unknown): CreateSneakerDto {
    return validarSneaker(value, false) as CreateSneakerDto;
  }
}
