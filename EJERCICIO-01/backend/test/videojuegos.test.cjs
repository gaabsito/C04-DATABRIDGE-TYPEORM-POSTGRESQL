const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { VideojuegosService } = require('../dist/videojuegos/videojuegos.service');

test('inserta tres ejemplos con género cuando la tabla está vacía', async () => {
  let guardados;
  const repository = {
    count: async () => 0,
    create: (dato) => dato,
    save: async (datos) => { guardados = datos; },
  };
  await new VideojuegosService(repository).onModuleInit();
  assert.equal(guardados.length, 3);
  assert.deepEqual(guardados.map(d => d.genero), ['Metroidvania', 'Aventura', 'Conducción']);
});

test('un nuevo arranque no vuelve a insertar si ya hay registros', async () => {
  const repository = {
    count: async () => 3,
    create: () => assert.fail('No debe crear más ejemplos'),
    save: async () => assert.fail('No debe volver a guardar'),
  };
  await new VideojuegosService(repository).onModuleInit();
});

test('consulta la colección por puntuación descendente y conserva el género', async () => {
  const datos = [{ id: 1, genero: 'Aventura', puntuacion: '9.8' }];
  const repository = { find: async (options) => {
    assert.deepEqual(options, { order: { puntuacion: 'DESC' } });
    return datos;
  }};
  assert.deepEqual(await new VideojuegosService(repository).findAll(), datos);
});
