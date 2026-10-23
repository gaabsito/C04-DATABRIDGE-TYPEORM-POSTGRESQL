import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sneaker } from './sneaker.entity';
import { CreateSneakerDto } from './create-sneaker.dto';
import { UpdateSneakerDto } from './update-sneaker.dto';

@Injectable()
export class SneakersService {
  constructor(
    @InjectRepository(Sneaker)
    private readonly repository: Repository<Sneaker>,
  ) {}

  findAll(): Promise<Sneaker[]> {
    return this.repository.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Sneaker> {
    const sneaker = await this.repository.findOneBy({ id });
    if (!sneaker) throw new NotFoundException('Sneaker no encontrada');
    return sneaker;
  }

  create(dto: CreateSneakerDto): Promise<Sneaker> {
    return this.repository.save(this.repository.create(dto));
  }

  async update(id: number, dto: UpdateSneakerDto): Promise<Sneaker> {
    const sneaker = await this.findOne(id);
    this.repository.merge(sneaker, dto);
    return this.repository.save(sneaker);
  }

  async remove(id: number): Promise<void> {
    const sneaker = await this.findOne(id);
    await this.repository.remove(sneaker);
  }
}
