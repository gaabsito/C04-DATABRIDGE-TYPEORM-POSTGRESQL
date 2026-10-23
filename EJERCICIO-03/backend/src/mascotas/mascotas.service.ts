import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mascota } from './mascota.entity';

@Injectable()
export class MascotasService implements OnModuleInit {
  constructor(@InjectRepository(Mascota) private readonly repository:Repository<Mascota>){}

  async onModuleInit(){
    if(await this.repository.count()===0){
      await this.repository.save(this.repository.create({
        nombre:'Nala',raza:'Golden Retriever',edad:4,ciudad:'Zaragoza',nivelEnergia:'Alta',
      }));
    }
  }

  async findOne(id:number):Promise<Mascota>{
    // Concepto protagonista: buscamos por el id recibido en la URL.
    const mascota=await this.repository.findOneBy({id});
    if(!mascota) throw new NotFoundException('Mascota no encontrada');
    return mascota;
  }
}