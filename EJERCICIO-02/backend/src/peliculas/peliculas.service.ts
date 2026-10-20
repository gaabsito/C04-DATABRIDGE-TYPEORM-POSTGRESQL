// peliculas.service.ts
// Incluimos datos iniciales para poder concentrarnos en aprender find().
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pelicula } from './pelicula.entity';

@Injectable()
export class PeliculasService implements OnModuleInit {
  constructor(@InjectRepository(Pelicula) private readonly repository:Repository<Pelicula>){}

  async onModuleInit(){
    if(await this.repository.count()===0){
      await this.repository.save([
        this.repository.create({titulo:'Interstellar',genero:'Ciencia ficción',anio:2014,puntuacion:9.2,favorita:true}),
        this.repository.create({titulo:'Coco',genero:'Animación',anio:2017,puntuacion:8.8,favorita:false}),
      ]);
    }
  }

  // Concepto protagonista: find() recupera la colección.
  findAll():Promise<Pelicula[]>{
    return this.repository.find({order:{puntuacion:'DESC'}});
  }
}