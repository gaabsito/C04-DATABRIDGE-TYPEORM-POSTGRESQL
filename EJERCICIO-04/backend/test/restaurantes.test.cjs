const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Restaurante } = require('../dist/restaurantes/restaurante.entity');
const { RestaurantesService } = require('../dist/restaurantes/restaurantes.service');
const { RestaurantesController } = require('../dist/restaurantes/restaurantes.controller');

test('precioMedio es una columna decimal persistente de dos decimales', () => {
  const column = getMetadataArgsStorage().columns.find(c => c.target === Restaurante && c.propertyName === 'precioMedio');
  assert.ok(column);
  assert.equal(column.options.type, 'decimal');
  assert.equal(column.options.scale, 2);
});

test('un fallo al guardar se propaga y no se anuncia como éxito', async () => {
  const repository = { create: dto => dto, save: async () => { throw new Error('Base de datos no disponible'); } };
  await assert.rejects(new RestaurantesService(repository).create({ nombre: 'A', tipo: 'B', ciudad: 'C', puntuacion: 9, precioMedio: 25 }), /Base de datos no disponible/);
});

test('POST /restaurantes valida Body, crea la Entity y guarda precioMedio', async t => {
  const operaciones = [];
  const repository = {
    create: dto => { operaciones.push('create'); return { ...dto }; },
    save: async entity => { operaciones.push('save'); return { id: 1, ...entity }; },
  };
  const module = await Test.createTestingModule({
    controllers: [RestaurantesController],
    providers: [RestaurantesService, { provide: getRepositoryToken(Restaurante), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());
  const datos = { nombre: 'La Trattoria', tipo: 'Italiano', ciudad: 'Zaragoza', puntuacion: 9, precioMedio: 25.5 };

  await t.test('responde 201 con el id y el precio enviado, descartando campos ajenos', async () => {
    const response = await request(app.getHttpServer()).post('/restaurantes').send({ ...datos, nombre: ' La Trattoria ', id: 999, otro: true }).expect(201);
    assert.deepEqual(response.body, { id: 1, ...datos });
    assert.deepEqual(operaciones, ['create', 'save']);
  });
  await t.test('rechaza nombre vacío sin consultar Repository', async () => {
    const antes = operaciones.length;
    await request(app.getHttpServer()).post('/restaurantes').send({ ...datos, nombre: '  ' }).expect(400);
    assert.equal(operaciones.length, antes);
  });
  await t.test('rechaza precio negativo, omitido o enviado como texto', async () => {
    const antes = operaciones.length;
    for (const precioMedio of [-1, undefined, '25.5']) {
      await request(app.getHttpServer()).post('/restaurantes').send({ ...datos, precioMedio }).expect(400);
    }
    assert.equal(operaciones.length, antes);
  });
  await t.test('rechaza puntuación fuera de rango', async () => {
    await request(app.getHttpServer()).post('/restaurantes').send({ ...datos, puntuacion: 11 }).expect(400);
  });
  await t.test('acepta precio y puntuación cero', async () => {
    const response = await request(app.getHttpServer()).post('/restaurantes').send({ ...datos, puntuacion: 0, precioMedio: 0 }).expect(201);
    assert.equal(response.body.precioMedio, 0);
    assert.equal(response.body.puntuacion, 0);
  });
});
