import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export class CreateCancionDto {
  titulo: string;
  artista: string;
  playlistId: number;
}

@Injectable()
export class CreateCancionPipe implements PipeTransform<unknown, CreateCancionDto> {
  transform(value: unknown): CreateCancionDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Envía un objeto JSON con la canción y playlistId.');
    }
    const body = value as Record<string, unknown>;
    const texto = (campo: string): string => {
      const dato = body[campo];
      if (typeof dato !== 'string' || !dato.trim() || dato.trim().length > 120) {
        throw new BadRequestException(`${campo} debe tener entre 1 y 120 caracteres.`);
      }
      return dato.trim();
    };
    const id = body.playlistId;
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > 2147483647) {
      throw new BadRequestException('playlistId debe ser un entero positivo válido.');
    }
    return { titulo: texto('titulo'), artista: texto('artista'), playlistId: id };
  }
}
