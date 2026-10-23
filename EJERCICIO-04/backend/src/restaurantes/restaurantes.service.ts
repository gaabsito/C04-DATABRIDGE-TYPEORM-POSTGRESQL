// restaurantes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestauranteDto } from './create-restaurante.dto';
import { Restaurante } from './restaurante.entity';

@Injectable()
export class RestaurantesService {
  constructor(
    @InjectRepository(Restaurante)
    private readonly repository: Repository<Restaurante>,
  ) {}

  async create(dto: CreateRestauranteDto): Promise<Restaurante> {
    // create() construye una Entity en memoria; todavía no guarda.
    const restaurante = this.repository.create(dto);

    // save() persiste la Entity en PostgreSQL.
    return this.repository.save(restaurante);
  }
}