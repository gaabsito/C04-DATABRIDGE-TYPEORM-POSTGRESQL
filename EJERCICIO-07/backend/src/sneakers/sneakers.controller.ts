import { Body,Controller,Delete,Get,HttpCode,Param,ParseIntPipe,Patch,Post } from '@nestjs/common';
import { SneakersService } from './sneakers.service';
import { CreateSneakerDto, CreateSneakerPipe } from './create-sneaker.dto';
import { UpdateSneakerDto, UpdateSneakerPipe } from './update-sneaker.dto';

@Controller('sneakers')
export class SneakersController {
 constructor(private readonly service:SneakersService){}
 @Get() findAll(){return this.service.findAll();}
 @Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(id);}
 @Post() create(@Body(new CreateSneakerPipe()) dto:CreateSneakerDto){return this.service.create(dto);}
 @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body(new UpdateSneakerPipe()) dto:UpdateSneakerDto){return this.service.update(id,dto);}
 @Delete(':id') @HttpCode(204) remove(@Param('id',ParseIntPipe) id:number){return this.service.remove(id);}
}