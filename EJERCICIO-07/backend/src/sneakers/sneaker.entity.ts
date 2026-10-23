import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('sneakers')
export class Sneaker {
 @PrimaryGeneratedColumn() id:number;
 @Column() marca:string;
 @Column() modelo:string;
 @Column('decimal',{precision:6,scale:2}) precio:number;
 @Column() talla:number;
 @Column({type:'int',default:0}) stock:number;
}