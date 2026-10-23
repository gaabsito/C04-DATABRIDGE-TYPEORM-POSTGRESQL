import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destino } from './destino.entity';
import { CreateDestinoDto } from './create-destino.dto';
import { UpdateDestinoDto } from './update-destino.dto';

@Injectable()
export class DestinosService {
  constructor(@InjectRepository(Destino) private readonly repository: Repository<Destino>) {}

  findAll(): Promise<Destino[]> {
    // El enum de PostgreSQL ordena ALTA, MEDIA y BAJA; a igualdad, el más nuevo.
    return this.repository.find({ order: { prioridad: 'ASC', id: 'DESC' } });
  }

  async findOne(id: number): Promise<Destino> {
    const destino = await this.repository.findOneBy({ id });
    if (!destino) throw new NotFoundException('Destino no encontrado');
    return destino;
  }

  create(dto: CreateDestinoDto): Promise<Destino> {
    return this.repository.save(this.repository.create(dto));
  }

  async update(id: number, dto: UpdateDestinoDto): Promise<Destino> {
    const destino = await this.findOne(id);
    this.repository.merge(destino, dto);
    return this.repository.save(destino);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const resultado = await this.repository.delete(id);
    if (resultado.affected === 0) throw new NotFoundException('Destino no encontrado');
  }
}
