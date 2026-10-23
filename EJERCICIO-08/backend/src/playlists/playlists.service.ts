import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './playlist.entity';
import { Cancion } from './cancion.entity';
import { CreateCancionDto } from './create-cancion.dto';

@Injectable()
export class PlaylistsService implements OnModuleInit {
  constructor(
    @InjectRepository(Playlist) private readonly playlists: Repository<Playlist>,
    @InjectRepository(Cancion) private readonly canciones: Repository<Cancion>,
  ) {}

  async onModuleInit(): Promise<void> {
    // La playlist inicial y su canción se guardan juntas.
    await this.playlists.manager.transaction(async manager => {
      const playlists = manager.getRepository(Playlist);
      const canciones = manager.getRepository(Cancion);
      if (await playlists.count() === 0) {
        const playlist = await playlists.save(playlists.create({ nombre: 'Entrenamiento' }));
        await canciones.save(canciones.create({ titulo: 'Run Boy Run', artista: 'Woodkid', playlist }));
      }
    });
  }

  async findOne(id: number): Promise<Playlist> {
    const playlist = await this.playlists.findOne({
      where: { id },
      relations: { canciones: true },
      order: { canciones: { id: 'ASC' } },
    });
    if (!playlist) throw new NotFoundException('Playlist no encontrada');
    return playlist;
  }

  async addSong(dto: CreateCancionDto): Promise<Cancion> {
    // Buscamos el padre antes de crear el hijo; una canción necesita playlist.
    const playlist = await this.playlists.findOneBy({ id: dto.playlistId });
    if (!playlist) throw new NotFoundException('Playlist no encontrada');
    const cancion = this.canciones.create({ titulo: dto.titulo, artista: dto.artista, playlist });
    return this.canciones.save(cancion);
  }
}
