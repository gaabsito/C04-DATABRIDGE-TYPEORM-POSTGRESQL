const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Mascota } = require('../dist/mascotas/mascota.entity');
const { MascotasService } = require('../dist/mascotas/mascotas.service');
const { MascotasController } = require('../dist/mascotas/mascotas.controller');

test('nivelEnergia es una columna persistente con valor por defecto Media', () => {
  const column = getMetadataArgsStorage().columns.find(c => c.target === Mascota && c.propertyName === 'nivelEnergia');
  assert.ok(column);
  assert.equal(column.options.default, 'Media');
});

test('inserta Nala con nivelEnergia Alta en una tabla vacía', async () => {
  let guardada;
  const repository = { count: async () => 0, create: p => p, save: async p => { guardada = p; } };
  await new MascotasService(repository).onModuleInit();
  assert.equal(guardada.nombre, 'Nala');
  assert.equal(guardada.nivelEnergia, 'Alta');
});

test('no vuelve a insertar ni sobrescribe datos al reiniciar', async () => {
  const repository = { count: async () => 1, save: () => assert.fail('No debe reinsertar') };
  await new MascotasService(repository).onModuleInit();
});

test('GET /mascotas/:id: objeto individual, 404 y validación del parámetro', async t => {
  const llamadas = [];
  const nala = { id: 1, nombre: 'Nala', raza: 'Golden Retriever', edad: 4, ciudad: 'Zaragoza', nivelEnergia: 'Alta' };
  const repository = {
    count: async () => 1,
    findOneBy: async ({ id }) => { llamadas.push(id); return id === 1 ? nala : null; },
  };
  const module = await Test.createTestingModule({
    controllers: [MascotasController],
    providers: [MascotasService, { provide: getRepositoryToken(Mascota), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());

  await t.test('devuelve un objeto con nivelEnergia y convierte el id en número', async () => {
    const response = await request(app.getHttpServer()).get('/mascotas/1').expect(200);
    assert.deepEqual(response.body, nala);
    assert.deepEqual(llamadas, [1]);
  });
  await t.test('una mascota inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer()).get('/mascotas/999').expect(404);
    assert.equal(response.body.message, 'Mascota no encontrada');
  });
  await t.test('un identificador no numérico devuelve 400 sin consultar la base', async () => {
    const antes = llamadas.length;
    await request(app.getHttpServer()).get('/mascotas/abc').expect(400);
    assert.equal(llamadas.length, antes);
  });
});
