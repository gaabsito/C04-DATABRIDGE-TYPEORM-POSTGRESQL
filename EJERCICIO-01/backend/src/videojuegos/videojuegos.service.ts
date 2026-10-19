// videojuegos.service.ts
// RESPONSABILIDAD:
// Trabajar con los datos mediante Repository<Videojuego>.

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Videojuego } from './videojuego.entity';

@Injectable()
export class VideojuegosService implements OnModuleInit {
  constructor(
    // NestJS inyecta el Repository que TypeORM ha creado
    // específicamente para la Entity Videojuego.
    @InjectRepository(Videojuego)
    private readonly repository: Repository<Videojuego>,
  ) {}

  // Solo para este primer ejercicio:
  // al arrancar añadimos ejemplos si la tabla está vacía.
  async onModuleInit(): Promise<void> {
    const total = await this.repository.count();

    if (total === 0) {
      const iniciales = [
        this.repository.create({
          titulo: 'Hollow Knight',
          genero: 'Metroidvania',
          plataforma: 'Nintendo Switch',
          puntuacion: 9.4,
        }),
        this.repository.create({
          titulo: 'Zelda: Tears of the Kingdom',
          genero: 'Aventura',
          plataforma: 'Nintendo Switch',
          puntuacion: 9.8,
        }),
        this.repository.create({
          titulo: 'Forza Horizon 5',
          genero: 'Conducción',
          plataforma: 'Xbox',
          puntuacion: 9.1,
        }),
      ];

      await this.repository.save(iniciales);
    }
  }

  // find() consulta la tabla videojuegos.
  // El resultado se ordena por puntuación descendente.
  findAll(): Promise<Videojuego[]> {
    return this.repository.find({
      order: { puntuacion: 'DESC' },
    });
  }
}
