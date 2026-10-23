import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Prioridad } from './prioridad';

@Entity('destinos')
export class Destino {
  @PrimaryGeneratedColumn() id: number;
  @Column() ciudad: string;
  @Column() pais: string;
  @Column() descripcion: string;
  @Column({ type: 'enum', enum: Prioridad, default: Prioridad.MEDIA })
  prioridad: Prioridad;
}
