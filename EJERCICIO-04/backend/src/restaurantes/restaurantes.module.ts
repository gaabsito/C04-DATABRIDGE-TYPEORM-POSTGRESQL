import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurante } from './restaurante.entity';
import { RestaurantesController } from './restaurantes.controller';
import { RestaurantesService } from './restaurantes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurante])],
  controllers: [RestaurantesController],
  providers: [RestaurantesService],
})
export class RestaurantesModule {}