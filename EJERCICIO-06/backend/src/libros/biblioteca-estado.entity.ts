import { Entity, PrimaryColumn } from 'typeorm';

// Recuerda que los ejemplos ya se inicializaron, incluso si se borran todos.
@Entity('biblioteca_estado')
export class BibliotecaEstado {
  @PrimaryColumn()
  id: string;
}
