const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Destino } = require('../dist/destinos/destino.entity');
const { Prioridad } = require('../dist/destinos/prioridad');
const { DestinosService } = require('../dist/destinos/destinos.service');
const { DestinosController } = require('../dist/destinos/destinos.controller');

test('prioridad se persiste como enum ordenado ALTA, MEDIA, BAJA y su valor inicial es MEDIA', () => {
  const column = getMetadataArgsStorage().columns.find(c => c.target === Destino && c.propertyName === 'prioridad');
  assert.ok(column);
  assert.equal(column.options.type, 'enum');
  assert.deepEqual(Object.values(column.options.enum), ['ALTA', 'MEDIA', 'BAJA']);
  assert.equal(column.options.default, Prioridad.MEDIA);
});

test('un fallo al guardar se propaga al cliente', async () => {
  const repository = { create: dto => dto, save: async () => { throw new Error('Sin conexión'); } };
  await assert.rejects(new DestinosService(repository).create({ ciudad: 'Reikiavik', pais: 'Islandia', descripcion: 'Auroras' }), /Sin conexión/);
});

test('borrar un registro que desaparece entre la búsqueda y el borrado produce 404', async () => {
  const repository = { findOneBy: async () => ({ id: 1 }), delete: async () => ({ affected: 0 }) };
  await assert.rejects(new DestinosService(repository).remove(1), e => e.getStatus() === 404);
});

test('CRUD HTTP de Wander con prioridad persistente y edición parcial', async t => {
  let rows = [];
  let siguiente = 1;
  let escrituras = 0;
  let consultas = 0;
  const rango = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  const repository = {
    find: async options => {
      assert.deepEqual(options.order, { prioridad: 'ASC', id: 'DESC' });
      return [...rows].sort((a, b) => rango[a.prioridad] - rango[b.prioridad] || b.id - a.id);
    },
    findOneBy: async ({ id }) => { consultas++; const row = rows.find(r => r.id === id); return row ? { ...row } : null; },
    create: dto => ({ ...dto }),
    merge: (entity, dto) => Object.assign(entity, dto),
    save: async entity => {
      escrituras++;
      const row = { ...entity, id: entity.id ?? siguiente++ };
      rows = [...rows.filter(r => r.id !== row.id), row];
      return { ...row };
    },
    delete: async id => {
      const affected = rows.some(r => r.id === id) ? 1 : 0;
      escrituras++; rows = rows.filter(r => r.id !== id);
      return { affected };
    },
  };
  const module = await Test.createTestingModule({
    controllers: [DestinosController],
    providers: [DestinosService, { provide: getRepositoryToken(Destino), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());
  const islandia = { ciudad: 'Reikiavik', pais: 'Islandia', descripcion: 'Ver auroras', prioridad: 'ALTA' };

  await t.test('la colección comienza vacía', async () => {
    const response = await request(app.getHttpServer()).get('/destinos').expect(200);
    assert.deepEqual(response.body, []);
  });
  await t.test('POST acepta prioridad, normaliza textos y no permite elegir el id', async () => {
    const response = await request(app.getHttpServer()).post('/destinos').send({ ...islandia, ciudad: ' Reikiavik ', id: 999 }).expect(201);
    assert.deepEqual(response.body, { ...islandia, id: 1 });
  });
  await t.test('POST sin prioridad utiliza MEDIA y la colección respeta el orden de prioridad', async () => {
    const lisboa = await request(app.getHttpServer()).post('/destinos').send({ ciudad: 'Lisboa', pais: 'Portugal', descripcion: 'Pasear por la ciudad' }).expect(201);
    assert.equal(lisboa.body.prioridad, 'MEDIA');
    await request(app.getHttpServer()).post('/destinos').send({ ciudad: 'Kioto', pais: 'Japón', descripcion: 'Visitar templos', prioridad: 'BAJA' }).expect(201);
    const lista = await request(app.getHttpServer()).get('/destinos').expect(200);
    assert.deepEqual(lista.body.map(d => d.id), [1, 2, 3]);
  });
  await t.test('GET individual devuelve el dato persistente de prioridad', async () => {
    const response = await request(app.getHttpServer()).get('/destinos/1').expect(200);
    assert.deepEqual(response.body, { ...islandia, id: 1 });
  });
  await t.test('PATCH solo prioridad conserva campos y reordena los destinos', async () => {
    const response = await request(app.getHttpServer()).patch('/destinos/3').send({ prioridad: 'ALTA' }).expect(200);
    assert.deepEqual(response.body, { id: 3, ciudad: 'Kioto', pais: 'Japón', descripcion: 'Visitar templos', prioridad: 'ALTA' });
    const lista = await request(app.getHttpServer()).get('/destinos').expect(200);
    assert.deepEqual(lista.body.map(d => d.id), [3, 1, 2]);
  });
  await t.test('PATCH sin prioridad no la restablece y tampoco permite cambiar el id', async () => {
    const response = await request(app.getHttpServer()).patch('/destinos/1').send({ descripcion: 'Auroras y cascadas', id: 100 }).expect(200);
    assert.deepEqual(response.body, { ...islandia, id: 1, descripcion: 'Auroras y cascadas' });
  });
  await t.test('rechaza prioridades desconocidas, cuerpos vacíos y campos inválidos', async () => {
    const antes = escrituras;
    for (const prioridad of ['URGENTE', 'alta', null, 9]) {
      await request(app.getHttpServer()).post('/destinos').send({ ...islandia, prioridad }).expect(400);
      await request(app.getHttpServer()).patch('/destinos/1').send({ prioridad }).expect(400);
    }
    for (const body of [{}, { id: 5 }, { ciudad: null }, { descripcion: ' ' }, { descripcion: 'A'.repeat(1001) }]) {
      await request(app.getHttpServer()).patch('/destinos/1').send(body).expect(400);
    }
    await request(app.getHttpServer()).post('/destinos').send({ ciudad: 'A', pais: 'B' }).expect(400);
    assert.equal(escrituras, antes);
  });
  await t.test('GET, PATCH y DELETE inexistentes responden 404', async () => {
    const antes = escrituras;
    await request(app.getHttpServer()).get('/destinos/999').expect(404);
    await request(app.getHttpServer()).patch('/destinos/999').send({ prioridad: 'ALTA' }).expect(404);
    await request(app.getHttpServer()).delete('/destinos/999').expect(404);
    assert.equal(escrituras, antes);
  });
  await t.test('los ids no numéricos se rechazan antes de consultar la base', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).get('/destinos/abc').expect(400);
    await request(app.getHttpServer()).patch('/destinos/abc').send({ prioridad: 'BAJA' }).expect(400);
    await request(app.getHttpServer()).delete('/destinos/abc').expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('DELETE responde 204, elimina solo el indicado y permite dejar la lista vacía', async () => {
    await request(app.getHttpServer()).delete('/destinos/3').expect(204);
    const lista = await request(app.getHttpServer()).get('/destinos').expect(200);
    assert.deepEqual(lista.body.map(d => d.id), [1, 2]);
    await request(app.getHttpServer()).delete('/destinos/1').expect(204);
    await request(app.getHttpServer()).delete('/destinos/2').expect(204);
    const vacia = await request(app.getHttpServer()).get('/destinos').expect(200);
    assert.deepEqual(vacia.body, []);
  });
});
