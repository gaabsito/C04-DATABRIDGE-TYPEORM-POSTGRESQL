import { Injectable, PipeTransform } from '@nestjs/common';
import { validarSneaker } from './create-sneaker.dto';

export class UpdateSneakerDto {
  marca?: string;
  modelo?: string;
  precio?: number;
  talla?: number;
  stock?: number;
}

@Injectable()
export class UpdateSneakerPipe implements PipeTransform<unknown, UpdateSneakerDto> {
  transform(value: unknown): UpdateSneakerDto {
    return validarSneaker(value, true);
  }
}
