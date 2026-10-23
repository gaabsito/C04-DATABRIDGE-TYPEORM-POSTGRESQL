import { Body,Controller,Delete,Get,HttpCode,Param,ParseIntPipe,Patch,Post } from '@nestjs/common';
import { DestinosService } from './destinos.service';
import { CreateDestinoDto, CreateDestinoPipe } from './create-destino.dto';
import { UpdateDestinoDto, UpdateDestinoPipe } from './update-destino.dto';

@Controller('destinos')
export class DestinosController {
 constructor(private readonly service:DestinosService){}
 @Get() findAll(){return this.service.findAll();}
 @Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(id);}
 @Post() create(@Body(new CreateDestinoPipe()) dto:CreateDestinoDto){return this.service.create(dto);}
 @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body(new UpdateDestinoPipe()) dto:UpdateDestinoDto){return this.service.update(id,dto);}
 @Delete(':id') @HttpCode(204) remove(@Param('id',ParseIntPipe) id:number){return this.service.remove(id);}
}