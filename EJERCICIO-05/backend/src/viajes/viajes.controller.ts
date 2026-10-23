import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UpdateViajeDto, UpdateViajePipe } from './update-viaje.dto';
import { Viaje } from './viaje.entity';
import { ViajesService } from './viajes.service';

@Controller('viajes')
export class ViajesController {
 constructor(private readonly service:ViajesService){}

 @Patch(':id')
 update(@Param('id',ParseIntPipe) id:number,@Body(new UpdateViajePipe()) dto:UpdateViajeDto):Promise<Viaje>{
   return this.service.update(id,dto);
 }
}