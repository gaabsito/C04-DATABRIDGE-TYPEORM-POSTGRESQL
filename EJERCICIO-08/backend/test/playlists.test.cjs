const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Playlist } = require('../dist/playlists/playlist.entity');
const { Cancion } = require('../dist/playlists/cancion.entity');
const { PlaylistsService } = require('../dist/playlists/playlists.service');
const { PlaylistsController } = require('../dist/playlists/playlists.controller');

test('el modelo define OneToMany y ManyToOne con clave foránea obligatoria', () => {
  const metadata = getMetadataArgsStorage();
  const padre = metadata.relations.find(r => r.target === Playlist && r.propertyName === 'canciones');
  const hijo = metadata.relations.find(r => r.target === Cancion && r.propertyName === 'playlist');
  assert.equal(padre.relationType, 'one-to-many');
  assert.equal(hijo.relationType, 'many-to-one');
  assert.equal(hijo.options.nullable, false);
  assert.equal(hijo.options.onDelete, 'CASCADE');
  assert.equal(metadata.joinColumns.find(c => c.target === Cancion).name, 'playlistId');
});

function fixtureInicializacion(existentes = []) {
  const playlists = [...existentes];
  const canciones = [];
  const playlistRepo = {
    count: async () => playlists.length,
    create: p => p,
    save: async p => { const row = { ...p, id: 1 }; playlists.push(row); return row; },
  };
  const cancionRepo = { create: p => p, save: async c => { canciones.push(c); return c; } };
  playlistRepo.manager = { transaction: async fn => fn({ getRepository: tipo => tipo === Playlist ? playlistRepo : cancionRepo }) };
  return { service: new PlaylistsService(playlistRepo, cancionRepo), playlists, canciones };
}

test('crea el ejemplo con su canción relacionada y no lo duplica al reiniciar', async () => {
  const f = fixtureInicializacion();
  await f.service.onModuleInit();
  await f.service.onModuleInit();
  assert.equal(f.playlists.length, 1);
  assert.equal(f.canciones.length, 1);
  assert.equal(f.canciones[0].playlist.id, f.playlists[0].id);
  assert.equal(f.canciones[0].titulo, 'Run Boy Run');
});

test('conserva las playlists existentes sin añadir ejemplos', async () => {
  const f = fixtureInicializacion([{ id: 5, nombre: 'Estudio' }]);
  await f.service.onModuleInit();
  assert.deepEqual(f.playlists, [{ id: 5, nombre: 'Estudio' }]);
  assert.deepEqual(f.canciones, []);
});

test('propaga el error de guardado de la canción', async () => {
  const playlists = { findOneBy: async () => ({ id: 1, nombre: 'Entrenamiento' }) };
  const canciones = { create: c => c, save: async () => { throw new Error('Sin conexión'); } };
  await assert.rejects(new PlaylistsService(playlists, canciones).addSong({ titulo: 'A', artista: 'B', playlistId: 1 }), /Sin conexión/);
});

test('GET con relations y POST asocian cada canción a su playlist', async t => {
  const padres = [{ id: 1, nombre: 'Entrenamiento' }, { id: 2, nombre: 'Estudio' }];
  const canciones = [{ id: 1, titulo: 'Run Boy Run', artista: 'Woodkid', playlist: padres[0] }];
  let consultas = 0;
  let escrituras = 0;
  const playlistRepo = {
    count: async () => padres.length,
    findOneBy: async ({ id }) => { consultas++; return padres.find(p => p.id === id) ?? null; },
    findOne: async options => {
      consultas++;
      assert.deepEqual(options.relations, { canciones: true });
      assert.deepEqual(options.order, { canciones: { id: 'ASC' } });
      const padre = padres.find(p => p.id === options.where.id);
      return padre ? { ...padre, canciones: canciones.filter(c => c.playlist.id === padre.id).map(c => ({ id: c.id, titulo: c.titulo, artista: c.artista })).sort((a, b) => a.id - b.id) } : null;
    },
  };
  const cancionRepo = {
    create: c => ({ ...c }),
    save: async c => { escrituras++; const row = { ...c, id: canciones.length + 1 }; canciones.push(row); return row; },
  };
  playlistRepo.manager = { transaction: async fn => fn({ getRepository: tipo => tipo === Playlist ? playlistRepo : cancionRepo }) };
  const module = await Test.createTestingModule({
    controllers: [PlaylistsController],
    providers: [PlaylistsService, { provide: getRepositoryToken(Playlist), useValue: playlistRepo }, { provide: getRepositoryToken(Cancion), useValue: cancionRepo }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());

  await t.test('GET carga la playlist con sus canciones', async () => {
    const response = await request(app.getHttpServer()).get('/playlists/1').expect(200);
    assert.equal(response.body.nombre, 'Entrenamiento');
    assert.deepEqual(response.body.canciones, [{ id: 1, titulo: 'Run Boy Run', artista: 'Woodkid' }]);
  });
  await t.test('una playlist vacía devuelve canciones como array vacío', async () => {
    const response = await request(app.getHttpServer()).get('/playlists/2').expect(200);
    assert.deepEqual(response.body.canciones, []);
  });
  await t.test('POST añade a la segunda playlist y deja intacta la primera', async () => {
    const response = await request(app.getHttpServer()).post('/playlists/canciones').send({ titulo: ' Intro ', artista: 'Artista', playlistId: 2, id: 999 }).expect(201);
    assert.equal(response.body.playlist.id, 2);
    assert.equal(response.body.titulo, 'Intro');
    assert.notEqual(response.body.id, 999);
    const primera = await request(app.getHttpServer()).get('/playlists/1').expect(200);
    const segunda = await request(app.getHttpServer()).get('/playlists/2').expect(200);
    assert.equal(primera.body.canciones.length, 1);
    assert.deepEqual(segunda.body.canciones.map(c => c.titulo), ['Intro']);
  });
  await t.test('una nueva consulta incluye la canción añadida a la primera playlist', async () => {
    await request(app.getHttpServer()).post('/playlists/canciones').send({ titulo: 'Otro tema', artista: 'Otro artista', playlistId: 1 }).expect(201);
    const response = await request(app.getHttpServer()).get('/playlists/1').expect(200);
    assert.deepEqual(response.body.canciones.map(c => c.titulo), ['Run Boy Run', 'Otro tema']);
  });
  await t.test('una playlist inexistente devuelve 404 y no guarda canciones huérfanas', async () => {
    const antes = escrituras;
    await request(app.getHttpServer()).post('/playlists/canciones').send({ titulo: 'Tema', artista: 'Artista', playlistId: 999 }).expect(404);
    assert.equal(escrituras, antes);
  });
  await t.test('rechaza ids inválidos y textos vacíos antes de consultar los repositorios', async () => {
    const antes = consultas;
    for (const body of [
      { titulo: 'Tema', artista: 'Artista', playlistId: '1' },
      { titulo: 'Tema', artista: 'Artista', playlistId: 0 },
      { titulo: 'Tema', artista: 'Artista', playlistId: 1.5 },
      { titulo: 'Tema', artista: 'Artista' },
      { titulo: ' ', artista: 'Artista', playlistId: 1 },
      { titulo: 'Tema', artista: '', playlistId: 1 },
    ]) await request(app.getHttpServer()).post('/playlists/canciones').send(body).expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('GET rechaza ids no numéricos sin consultar la base', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).get('/playlists/abc').expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('GET de una playlist inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer()).get('/playlists/999').expect(404);
    assert.equal(response.body.message, 'Playlist no encontrada');
  });
});
