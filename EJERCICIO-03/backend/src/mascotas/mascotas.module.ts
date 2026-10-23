// mascotas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mascota } from './mascota.entity';
import { MascotasController } from './mascotas.controller';
import { MascotasService } from './mascotas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mascota])],
  controllers: [MascotasController],
  providers: [MascotasService],
})
export class MascotasModule {}