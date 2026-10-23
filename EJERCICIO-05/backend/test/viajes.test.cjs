const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const request = require('supertest');
const { Viaje } = require('../dist/viajes/viaje.entity');
const { ViajesService } = require('../dist/viajes/viajes.service');
const { ViajesController } = require('../dist/viajes/viajes.controller');

test('inserta el viaje inicial con su fecha en una tabla vacía', async () => {
  let guardado;
  const repository = { count: async () => 0, create: dto => dto, save: async dto => { guardado = dto; } };
  await new ViajesService(repository).onModuleInit();
  assert.deepEqual(guardado, { destino: 'Tokio', pais: 'Japón', fecha: '2027-04-10', estado: 'RESERVADO' });
});

test('reiniciar no reinserta ni restaura los valores iniciales', async () => {
  const repository = { count: async () => 1, save: () => assert.fail('No debe sobrescribir los cambios') };
  await new ViajesService(repository).onModuleInit();
});

test('propaga los errores al guardar', async () => {
  const repository = { findOneBy: async () => ({ id: 1 }), merge: Object.assign, save: async () => { throw new Error('Sin conexión'); } };
  await assert.rejects(new ViajesService(repository).update(1, { fecha: '2027-05-20' }), /Sin conexión/);
});

test('PATCH /viajes/:id conserva los campos que no se envían', async t => {
  const original = { id: 1, destino: 'Tokio', pais: 'Japón', fecha: '2027-04-10', estado: 'RESERVADO' };
  let almacenado = { ...original };
  let consultas = 0;
  let escrituras = 0;
  const repository = {
    count: async () => 1,
    findOneBy: async ({ id }) => { consultas++; return id === 1 ? { ...almacenado } : null; },
    merge: (entity, dto) => Object.assign(entity, dto),
    save: async entity => { escrituras++; almacenado = { ...entity }; return { ...entity }; },
  };
  const module = await Test.createTestingModule({
    controllers: [ViajesController],
    providers: [ViajesService, { provide: getRepositoryToken(Viaje), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());

  await t.test('cambia solo fecha sin exigir destino, pais ni estado', async () => {
    const response = await request(app.getHttpServer()).patch('/viajes/1').send({ fecha: '2027-05-20' }).expect(200);
    assert.deepEqual(response.body, { ...original, fecha: '2027-05-20' });
    assert.equal(escrituras, 1);
  });
  await t.test('cambia solo estado y conserva la fecha actualizada', async () => {
    const response = await request(app.getHttpServer()).patch('/viajes/1').send({ estado: 'CONFIRMADO' }).expect(200);
    assert.deepEqual(response.body, { ...original, fecha: '2027-05-20', estado: 'CONFIRMADO' });
  });
  await t.test('permite fecha y estado juntos, acepta año bisiesto y descarta id', async () => {
    const response = await request(app.getHttpServer()).patch('/viajes/1').send({ fecha: '2028-02-29', estado: 'PLANIFICADO', id: 999 }).expect(200);
    assert.equal(response.body.id, 1);
    assert.equal(response.body.fecha, '2028-02-29');
    assert.equal(response.body.destino, 'Tokio');
  });
  await t.test('devuelve 404 sin guardar si el viaje no existe', async () => {
    const antes = escrituras;
    const response = await request(app.getHttpServer()).patch('/viajes/999').send({ fecha: '2027-06-01' }).expect(404);
    assert.equal(response.body.message, 'Viaje no encontrado');
    assert.equal(escrituras, antes);
  });
  await t.test('devuelve 400 para un identificador inválido sin consultar Repository', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).patch('/viajes/abc').send({ estado: 'RESERVADO' }).expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('rechaza fechas imposibles o mal formateadas sin escribir', async () => {
    const antes = escrituras;
    for (const fecha of ['2027-02-29', '2027-13-01', '20/05/2027', '2027-04-31']) {
      await request(app.getHttpServer()).patch('/viajes/1').send({ fecha }).expect(400);
    }
    assert.equal(escrituras, antes);
  });
  await t.test('rechaza cuerpos vacíos, solo id o campos nulos/vacíos', async () => {
    const antes = escrituras;
    for (const body of [{}, { id: 2 }, { fecha: null }, { estado: '  ' }]) {
      await request(app.getHttpServer()).patch('/viajes/1').send(body).expect(400);
    }
    assert.equal(escrituras, antes);
  });
});
