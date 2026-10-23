import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Datos que el cliente debe enviar al crear un restaurante.
export class CreateRestauranteDto {
  nombre: string;
  tipo: string;
  ciudad: string;
  puntuacion: number;
  precioMedio: number;
}

// Los tipos TypeScript no validan el JSON en ejecución.
@Injectable()
export class CreateRestaurantePipe implements PipeTransform<unknown, CreateRestauranteDto> {
  transform(value: unknown): CreateRestauranteDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Envía un objeto JSON con los datos del restaurante.');
    }
    const body = value as Record<string, unknown>;
    const texto = (campo: string): string => {
      const dato = body[campo];
      if (typeof dato !== 'string' || !dato.trim() || dato.trim().length > 120) {
        throw new BadRequestException(`${campo} debe tener entre 1 y 120 caracteres.`);
      }
      return dato.trim();
    };
    const numero = (campo: string, maximo: number): number => {
      const dato = body[campo];
      if (typeof dato !== 'number' || !Number.isFinite(dato) || dato < 0 || dato > maximo) {
        throw new BadRequestException(`${campo} debe ser un número entre 0 y ${maximo}.`);
      }
      return dato;
    };
    // Solo trasladamos los campos permitidos. El id lo genera PostgreSQL.
    return {
      nombre: texto('nombre'),
      tipo: texto('tipo'),
      ciudad: texto('ciudad'),
      puntuacion: numero('puntuacion', 10),
      precioMedio: numero('precioMedio', 999999.99),
    };
  }
}
