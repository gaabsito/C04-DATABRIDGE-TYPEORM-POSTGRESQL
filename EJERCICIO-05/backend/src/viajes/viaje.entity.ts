import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('viajes')
export class Viaje {
 @PrimaryGeneratedColumn() id:number;
 @Column() destino:string;
 @Column() pais:string;
 @Column() fecha:string;
 @Column() estado:string;
}