// restaurantes.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateRestauranteDto, CreateRestaurantePipe } from './create-restaurante.dto';
import { Restaurante } from './restaurante.entity';
import { RestaurantesService } from './restaurantes.service';

@Controller('restaurantes')
export class RestaurantesController {
  constructor(private readonly service: RestaurantesService) {}

  @Post()
  create(
    @Body(new CreateRestaurantePipe()) dto: CreateRestauranteDto,
  ): Promise<Restaurante> {
    return this.service.create(dto);
  }
}