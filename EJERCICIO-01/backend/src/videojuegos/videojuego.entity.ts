// videojuego.entity.ts
// RESPONSABILIDAD:
// Describir cómo se guarda UN videojuego en PostgreSQL.

import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Esta clase se relaciona con la tabla "videojuegos".
@Entity('videojuegos')
export class Videojuego {
  // PostgreSQL genera automáticamente el identificador.
  @PrimaryGeneratedColumn()
  id: number;

  // Cada @Column representa una columna de la tabla.
  @Column()
  titulo: string;

  @Column()
  plataforma: string;

  @Column({ default: 'Sin clasificar' })
  genero: string;

  // precision 3 + scale 1 permite valores como 9.4 o 10.0.
  @Column('decimal', { precision: 3, scale: 1 })
  puntuacion: number;
}
