const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Sneaker } = require('../dist/sneakers/sneaker.entity');
const { SneakersService } = require('../dist/sneakers/sneakers.service');
const { SneakersController } = require('../dist/sneakers/sneakers.controller');

test('stock se persiste como entero con valor inicial cero', () => {
  const column = getMetadataArgsStorage().columns.find(c => c.target === Sneaker && c.propertyName === 'stock');
  assert.ok(column);
  assert.equal(column.options.type, 'int');
  assert.equal(column.options.default, 0);
});

test('un fallo al guardar no se convierte en un éxito', async () => {
  const repository = { create: dto => dto, save: async () => { throw new Error('Sin conexión'); } };
  await assert.rejects(new SneakersService(repository).create({ marca: 'Nike', modelo: 'Air Max', precio: 149.99, talla: 42, stock: 3 }), /Sin conexión/);
});

test('CRUD HTTP completo con stock numérico y PATCH parcial', async t => {
  let rows = [];
  let siguiente = 1;
  let escrituras = 0;
  let consultas = 0;
  const repository = {
    find: async options => { assert.deepEqual(options, { order: { id: 'DESC' } }); return [...rows].sort((a, b) => b.id - a.id); },
    findOneBy: async ({ id }) => { consultas++; const row = rows.find(r => r.id === id); return row ? { ...row } : null; },
    create: dto => ({ ...dto }),
    merge: (entity, dto) => Object.assign(entity, dto),
    save: async entity => {
      escrituras++;
      const row = { ...entity, id: entity.id ?? siguiente++ };
      rows = [...rows.filter(r => r.id !== row.id), row];
      return { ...row };
    },
    remove: async entity => { escrituras++; rows = rows.filter(r => r.id !== entity.id); return entity; },
  };
  const module = await Test.createTestingModule({
    controllers: [SneakersController],
    providers: [SneakersService, { provide: getRepositoryToken(Sneaker), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());
  const datos = { marca: 'Nike', modelo: 'Air Max 1', precio: 149.99, talla: 42, stock: 3 };

  await t.test('una colección nueva devuelve un array vacío', async () => {
    const response = await request(app.getHttpServer()).get('/sneakers').expect(200);
    assert.deepEqual(response.body, []);
  });
  await t.test('POST guarda stock y descarta id y AGOTADO enviados por el cliente', async () => {
    const response = await request(app.getHttpServer()).post('/sneakers').send({ ...datos, marca: ' Nike ', id: 999, agotado: 'AGOTADO' }).expect(201);
    assert.deepEqual(response.body, { ...datos, id: 1 });
    assert.equal(typeof response.body.stock, 'number');
  });
  await t.test('GET individual y colección devuelven el mismo stock', async () => {
    const individual = await request(app.getHttpServer()).get('/sneakers/1').expect(200);
    const lista = await request(app.getHttpServer()).get('/sneakers').expect(200);
    assert.deepEqual(individual.body, { ...datos, id: 1 });
    assert.deepEqual(lista.body, [individual.body]);
  });
  await t.test('PATCH solo stock admite cero sin alterar marca, modelo, talla o precio', async () => {
    const response = await request(app.getHttpServer()).patch('/sneakers/1').send({ stock: 0 }).expect(200);
    assert.deepEqual(response.body, { ...datos, id: 1, stock: 0 });
    const lista = await request(app.getHttpServer()).get('/sneakers').expect(200);
    assert.equal(lista.body[0].stock, 0);
    assert.equal(Object.hasOwn(lista.body[0], 'agotado'), false);
  });
  await t.test('rebajar precio conserva el stock y el id', async () => {
    const response = await request(app.getHttpServer()).patch('/sneakers/1').send({ precio: 139.99, id: 500 }).expect(200);
    assert.deepEqual(response.body, { ...datos, id: 1, stock: 0, precio: 139.99 });
  });
  await t.test('rechaza stock negativo, fraccionario, textual, omitido o nulo en POST', async () => {
    const antes = escrituras;
    for (const stock of [-1, 1.5, '3', undefined, null]) {
      await request(app.getHttpServer()).post('/sneakers').send({ ...datos, stock }).expect(400);
    }
    assert.equal(escrituras, antes);
  });
  await t.test('rechaza campos inválidos y PATCH sin cambios antes de escribir', async () => {
    const antes = escrituras;
    for (const body of [{}, { id: 4 }, { stock: -1 }, { precio: -10 }, { talla: 42.5 }, { marca: '  ' }]) {
      await request(app.getHttpServer()).patch('/sneakers/1').send(body).expect(400);
    }
    assert.equal(escrituras, antes);
  });
  await t.test('GET, PATCH y DELETE inexistentes devuelven 404', async () => {
    const antes = escrituras;
    await request(app.getHttpServer()).get('/sneakers/999').expect(404);
    await request(app.getHttpServer()).patch('/sneakers/999').send({ stock: 2 }).expect(404);
    await request(app.getHttpServer()).delete('/sneakers/999').expect(404);
    assert.equal(escrituras, antes);
  });
  await t.test('los ids inválidos se rechazan sin consultar Repository', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).get('/sneakers/abc').expect(400);
    await request(app.getHttpServer()).patch('/sneakers/abc').send({ stock: 1 }).expect(400);
    await request(app.getHttpServer()).delete('/sneakers/abc').expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('DELETE responde 204 y elimina el último registro', async () => {
    await request(app.getHttpServer()).delete('/sneakers/1').expect(204);
    const response = await request(app.getHttpServer()).get('/sneakers').expect(200);
    assert.deepEqual(response.body, []);
  });
});
