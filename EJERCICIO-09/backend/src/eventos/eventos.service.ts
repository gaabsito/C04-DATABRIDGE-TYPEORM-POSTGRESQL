import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Evento } from './evento.entity';

@Injectable()
export class EventosService implements OnModuleInit {
  constructor(@InjectRepository(Evento) private readonly repository: Repository<Evento>) {}

  async onModuleInit(): Promise<void> {
    if (await this.repository.count() === 0) {
      await this.repository.save([
        this.repository.create({ nombre: 'Tech Meetup', ciudad: 'Zaragoza', categoria: 'Tecnologia', fecha: '2027-03-12' }),
        this.repository.create({ nombre: 'Festival Indie', ciudad: 'Zaragoza', categoria: 'Musica', fecha: '2027-04-20' }),
        this.repository.create({ nombre: 'Dev Conference', ciudad: 'Madrid', categoria: 'Tecnologia', fecha: '2027-05-15' }),
      ]);
    }
  }

  findAll(ciudad?: string, categoria?: string): Promise<Evento[]> {
    const where: FindOptionsWhere<Evento> = {};
    // Un único objeto where combina las condiciones con AND.
    // Los parámetros ausentes no añaden condiciones a la consulta.
    if (ciudad) where.ciudad = ciudad;
    if (categoria) where.categoria = categoria;
    return this.repository.find({ where, order: { fecha: 'ASC', id: 'ASC' } });
  }
}
