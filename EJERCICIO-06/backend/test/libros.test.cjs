const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { getMetadataArgsStorage } = require('typeorm');
const request = require('supertest');
const { Libro } = require('../dist/libros/libro.entity');
const { BibliotecaEstado } = require('../dist/libros/biblioteca-estado.entity');
const { LibrosService } = require('../dist/libros/libros.service');
const { LibrosController } = require('../dist/libros/libros.controller');

function inicializacion(iniciales = []) {
  const rows = [...iniciales];
  let marca = false;
  const libros = { count: async () => rows.length, create: p => p, save: async datos => rows.push(...datos) };
  const estados = { findOneBy: async () => marca ? { id: 'ejemplos-iniciales' } : null, create: p => p, save: async () => { marca = true; } };
  const repository = { manager: { transaction: async fn => fn({ getRepository: entity => entity === BibliotecaEstado ? estados : libros }) } };
  return { service: new LibrosService(repository), rows, tieneMarca: () => marca };
}

test('leido es una columna persistente con valor inicial false', () => {
  const col = getMetadataArgsStorage().columns.find(c => c.target === Libro && c.propertyName === 'leido');
  assert.ok(col);
  assert.equal(col.options.default, false);
});

test('primera carga inserta dos libros pendientes y recuerda la inicialización', async () => {
  const f = inicializacion();
  await f.service.onModuleInit();
  assert.deepEqual(f.rows.map(l => [l.titulo, l.leido]), [['1984', false], ['Dune', false]]);
  assert.equal(f.tieneMarca(), true);
});

test('borrar todos y reiniciar no hace reaparecer los ejemplos', async () => {
  const f = inicializacion();
  await f.service.onModuleInit();
  f.rows.splice(0);
  await f.service.onModuleInit();
  assert.deepEqual(f.rows, []);
});

test('una base con datos previos conserva sus libros y su estado', async () => {
  const previo = { titulo: 'Mi libro', leido: true };
  const f = inicializacion([previo]);
  await f.service.onModuleInit();
  assert.deepEqual(f.rows, [previo]);
  assert.equal(f.tieneMarca(), true);
});

test('un fallo al borrar se propaga al cliente', async () => {
  const repository = { findOneBy: async () => ({ id: 1 }), remove: async () => { throw new Error('Sin conexión'); } };
  await assert.rejects(new LibrosService(repository).remove(1), /Sin conexión/);
});

test('GET, PATCH leído y DELETE mantienen una colección coherente', async t => {
  let rows = [
    { id: 1, titulo: '1984', autor: 'George Orwell', genero: 'Distopía', leido: false },
    { id: 2, titulo: 'Dune', autor: 'Frank Herbert', genero: 'Ciencia ficción', leido: false },
  ];
  let consultas = 0;
  const repository = {
    manager: { transaction: async fn => fn({ getRepository: () => ({ findOneBy: async () => ({ id: 'ejemplos-iniciales' }) }) }) },
    find: async options => { assert.deepEqual(options, { order: { titulo: 'ASC' } }); return [...rows].sort((a, b) => a.titulo.localeCompare(b.titulo)); },
    findOneBy: async ({ id }) => { consultas++; const row = rows.find(l => l.id === id); return row ? { ...row } : null; },
    save: async libro => { rows = rows.map(l => l.id === libro.id ? { ...libro } : l); return libro; },
    remove: async libro => { rows = rows.filter(l => l.id !== libro.id); return libro; },
  };
  const module = await Test.createTestingModule({
    controllers: [LibrosController],
    providers: [LibrosService, { provide: getRepositoryToken(Libro), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());

  await t.test('GET devuelve los libros ordenados con leido', async () => {
    const response = await request(app.getHttpServer()).get('/libros').expect(200);
    assert.deepEqual(response.body.map(l => [l.titulo, l.leido]), [['1984', false], ['Dune', false]]);
  });
  await t.test('PATCH marca como leído sin eliminar ni alterar el título', async () => {
    await request(app.getHttpServer()).patch('/libros/1/leido').expect(200);
    const response = await request(app.getHttpServer()).get('/libros').expect(200);
    assert.equal(response.body.length, 2);
    assert.equal(response.body[0].titulo, '1984');
    assert.equal(response.body[0].leido, true);
  });
  await t.test('volver a marcar como leído conserva los dos libros', async () => {
    await request(app.getHttpServer()).patch('/libros/1/leido').expect(200);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].leido, true);
  });
  await t.test('DELETE responde 204 y solo elimina el libro elegido', async () => {
    await request(app.getHttpServer()).delete('/libros/1').expect(204);
    const response = await request(app.getHttpServer()).get('/libros').expect(200);
    assert.deepEqual(response.body.map(l => l.id), [2]);
  });
  await t.test('eliminar o marcar un libro inexistente devuelve 404', async () => {
    await request(app.getHttpServer()).delete('/libros/999').expect(404);
    await request(app.getHttpServer()).patch('/libros/999/leido').expect(404);
    assert.equal(rows.length, 1);
  });
  await t.test('los identificadores inválidos se rechazan sin consultar Repository', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).delete('/libros/abc').expect(400);
    await request(app.getHttpServer()).patch('/libros/abc/leido').expect(400);
    assert.equal(consultas, antes);
  });
  await t.test('eliminar el último libro deja una colección vacía', async () => {
    await request(app.getHttpServer()).delete('/libros/2').expect(204);
    await new LibrosService(repository).onModuleInit();
    const response = await request(app.getHttpServer()).get('/libros').expect(200);
    assert.deepEqual(response.body, []);
  });
});
