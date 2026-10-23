import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateViajeDto } from './update-viaje.dto';
import { Viaje } from './viaje.entity';

@Injectable()
export class ViajesService implements OnModuleInit {
 constructor(@InjectRepository(Viaje) private readonly repository:Repository<Viaje>){}

 async onModuleInit(){
   if(await this.repository.count()===0){
     await this.repository.save(this.repository.create({
       destino:'Tokio',pais:'Japón',fecha:'2027-04-10',estado:'RESERVADO',
     }));
   }
 }

 async update(id:number,dto:UpdateViajeDto):Promise<Viaje>{
   const viaje=await this.repository.findOneBy({id});
   if(!viaje) throw new NotFoundException('Viaje no encontrado');
   // merge cambia solo las propiedades presentes en el Body PATCH.
   this.repository.merge(viaje,dto);
   return this.repository.save(viaje);
 }
}