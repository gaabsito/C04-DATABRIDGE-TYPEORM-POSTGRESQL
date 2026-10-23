// mascota.entity.ts
// RESPONSABILIDAD: definir la información persistente de una mascota.
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mascotas')
export class Mascota {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  raza: string;

  @Column()
  edad: number;

  @Column()
  ciudad: string;

  @Column({ default: "Media" })
  nivelEnergia: string;
}
