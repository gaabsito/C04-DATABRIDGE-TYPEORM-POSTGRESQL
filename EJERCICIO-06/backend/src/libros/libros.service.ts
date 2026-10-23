import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from './libro.entity';
import { BibliotecaEstado } from './biblioteca-estado.entity';

@Injectable()
export class LibrosService implements OnModuleInit {
  constructor(@InjectRepository(Libro) private readonly repository: Repository<Libro>) {}

  async onModuleInit(): Promise<void> {
    // La marca y los ejemplos se guardan juntos. Así vaciar la biblioteca
    // no provoca que los libros eliminados reaparezcan al reiniciar NestJS.
    await this.repository.manager.transaction(async manager => {
      const estados = manager.getRepository(BibliotecaEstado);
      if (await estados.findOneBy({ id: 'ejemplos-iniciales' })) return;
      const libros = manager.getRepository(Libro);
      if (await libros.count() === 0) {
        await libros.save([
          libros.create({ titulo: '1984', autor: 'George Orwell', genero: 'Distopía', leido: false }),
          libros.create({ titulo: 'Dune', autor: 'Frank Herbert', genero: 'Ciencia ficción', leido: false }),
        ]);
      }
      await estados.save(estados.create({ id: 'ejemplos-iniciales' }));
    });
  }

  findAll(): Promise<Libro[]> {
    return this.repository.find({ order: { titulo: 'ASC' } });
  }

  async remove(id: number): Promise<void> {
    const libro = await this.repository.findOneBy({ id });
    if (!libro) throw new NotFoundException('Libro no encontrado');
    await this.repository.remove(libro);
  }

  async marcarLeido(id: number): Promise<void> {
    const libro = await this.repository.findOneBy({ id });
    if (!libro) throw new NotFoundException('Libro no encontrado');
    libro.leido = true;
    await this.repository.save(libro);
  }
}
