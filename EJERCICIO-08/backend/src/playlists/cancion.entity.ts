import { Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn } from 'typeorm';
import { Playlist } from './playlist.entity';

@Entity('canciones')
export class Cancion {
 @PrimaryGeneratedColumn() id:number;
 @Column() titulo:string;
 @Column() artista:string;

 // ManyToOne es el lado que almacena la clave foránea.
 @ManyToOne(()=>Playlist,(playlist)=>playlist.canciones,{onDelete:'CASCADE',nullable:false})
 @JoinColumn({name:'playlistId'})
 playlist:Playlist;
}