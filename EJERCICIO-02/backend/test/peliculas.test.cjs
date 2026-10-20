const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { getMetadataArgsStorage } = require('typeorm');
const { Pelicula } = require('../dist/peliculas/pelicula.entity');
const { PeliculasService } = require('../dist/peliculas/peliculas.service');
const { PeliculasController } = require('../dist/peliculas/peliculas.controller');

test('favorita es una columna booleana persistente con valor inicial false', () => {
  const column = getMetadataArgsStorage().columns.find(c => c.target === Pelicula && c.propertyName === 'favorita');
  assert.ok(column);
  assert.equal(column.options.type, 'boolean');
  assert.equal(column.options.default, false);
});

test('la primera carga incluye películas favoritas y no favoritas', async () => {
  let guardadas;
  const repository = { count: async () => 0, create: p => p, save: async p => { guardadas = p; } };
  await new PeliculasService(repository).onModuleInit();
  assert.deepEqual(guardadas.map(p => [p.titulo, p.favorita]), [['Interstellar', true], ['Coco', false]]);
});

test('no reinserta ejemplos cuando ya hay películas', async () => {
  const repository = { count: async () => 2, save: () => assert.fail('No debe duplicar datos') };
  await new PeliculasService(repository).onModuleInit();
});

test('GET delega en find y devuelve la colección con favorita', async () => {
  const peliculas = [{ id: 1, titulo: 'Interstellar', favorita: true, puntuacion: '9.2' }];
  const repository = { find: async options => {
    assert.deepEqual(options, { order: { puntuacion: 'DESC' } });
    return peliculas;
  }};
  const controller = new PeliculasController(new PeliculasService(repository));
  assert.deepEqual(await controller.findAll(), peliculas);
});

test('una colección sin registros se devuelve como array vacío', async () => {
  const service = new PeliculasService({ find: async () => [] });
  assert.deepEqual(await service.findAll(), []);
});
