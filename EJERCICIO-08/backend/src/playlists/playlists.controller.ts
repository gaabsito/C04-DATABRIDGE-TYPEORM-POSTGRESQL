import { Body,Controller,Get,Param,ParseIntPipe,Post } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreateCancionDto, CreateCancionPipe } from './create-cancion.dto';
@Controller('playlists')
export class PlaylistsController {
 constructor(private readonly service:PlaylistsService){}
 @Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(id);}
 @Post('canciones') addSong(@Body(new CreateCancionPipe()) dto:CreateCancionDto){return this.service.addSong(dto);}
}