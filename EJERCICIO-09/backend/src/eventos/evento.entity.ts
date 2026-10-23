import { Column,Entity,PrimaryGeneratedColumn } from 'typeorm';
@Entity('eventos')
export class Evento {
 @PrimaryGeneratedColumn() id:number;
 @Column() nombre:string;
 @Column() ciudad:string;
 @Column() categoria:string;
 @Column() fecha:string;
}