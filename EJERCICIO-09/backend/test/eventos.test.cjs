const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { getRepositoryToken } = require('@nestjs/typeorm');
const request = require('supertest');
const { Evento } = require('../dist/eventos/evento.entity');
const { EventosService } = require('../dist/eventos/eventos.service');
const { EventosController } = require('../dist/eventos/eventos.controller');

test('inserta ejemplos que permiten distinguir los filtros y no los duplica', async () => {
  const rows = [];
  const repository = { count: async () => rows.length, create: e => e, save: async datos => rows.push(...datos) };
  const service = new EventosService(repository);
  await service.onModuleInit();
  await service.onModuleInit();
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(e => [e.ciudad, e.categoria]), [['Zaragoza', 'Tecnologia'], ['Zaragoza', 'Musica'], ['Madrid', 'Tecnologia']]);
});

test('con datos existentes no vuelve a guardar ejemplos', async () => {
  await new EventosService({ count: async () => 5, save: () => assert.fail('No debe sobrescribir') }).onModuleInit();
});

test('propaga un fallo al consultar el repositorio', async () => {
  const service = new EventosService({ find: async () => { throw new Error('Sin conexión'); } });
  await assert.rejects(service.findAll('Zaragoza', 'Tecnologia'), /Sin conexión/);
});

test('GET /eventos combina Query Params opcionales', async t => {
  const rows = [
    { id: 1, nombre: 'Tech Meetup', ciudad: 'Zaragoza', categoria: 'Tecnologia', fecha: '2027-03-12' },
    { id: 2, nombre: 'Festival Indie', ciudad: 'Zaragoza', categoria: 'Musica', fecha: '2027-04-20' },
    { id: 3, nombre: 'Dev Conference', ciudad: 'Madrid', categoria: 'Tecnologia', fecha: '2027-05-15' },
    { id: 4, nombre: 'Festival local', ciudad: 'A Coruña', categoria: 'Música en vivo', fecha: '2027-01-20' },
  ];
  let ultimoWhere;
  let consultas = 0;
  const repository = {
    count: async () => rows.length,
    find: async options => {
      consultas++;
      ultimoWhere = options.where;
      assert.deepEqual(options.order, { fecha: 'ASC', id: 'ASC' });
      return rows.filter(e => Object.entries(options.where).every(([campo, valor]) => e[campo] === valor))
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
    },
  };
  const module = await Test.createTestingModule({
    controllers: [EventosController],
    providers: [EventosService, { provide: getRepositoryToken(Evento), useValue: repository }],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  t.after(() => app.close());

  await t.test('sin filtros devuelve toda la colección ordenada', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').expect(200);
    assert.deepEqual(ultimoWhere, {});
    assert.deepEqual(response.body.map(e => e.id), [4, 1, 2, 3]);
  });
  await t.test('solo ciudad conserva todas las categorías de esa ciudad', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ ciudad: 'Zaragoza' }).expect(200);
    assert.deepEqual(ultimoWhere, { ciudad: 'Zaragoza' });
    assert.deepEqual(response.body.map(e => e.id), [1, 2]);
  });
  await t.test('solo categoría conserva las ciudades que coinciden', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ categoria: 'Tecnologia' }).expect(200);
    assert.deepEqual(ultimoWhere, { categoria: 'Tecnologia' });
    assert.deepEqual(response.body.map(e => e.id), [1, 3]);
  });
  await t.test('ciudad y categoría se combinan con AND en un único where', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ ciudad: 'Zaragoza', categoria: 'Tecnologia' }).expect(200);
    assert.deepEqual(ultimoWhere, { ciudad: 'Zaragoza', categoria: 'Tecnologia' });
    assert.deepEqual(response.body.map(e => e.id), [1]);
  });
  await t.test('filtros vacíos o con espacios se consideran ausentes', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ ciudad: '  ', categoria: '' }).expect(200);
    assert.deepEqual(ultimoWhere, {});
    assert.equal(response.body.length, 4);
  });
  await t.test('recorta espacios antes de aplicar un filtro', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ ciudad: ' Zaragoza ' }).expect(200);
    assert.deepEqual(ultimoWhere, { ciudad: 'Zaragoza' });
    assert.deepEqual(response.body.map(e => e.id), [1, 2]);
  });
  await t.test('la URL admite espacios y caracteres acentuados codificados', async () => {
    const response = await request(app.getHttpServer()).get('/eventos?ciudad=A%20Coru%C3%B1a&categoria=M%C3%BAsica%20en%20vivo').expect(200);
    assert.deepEqual(ultimoWhere, { ciudad: 'A Coruña', categoria: 'Música en vivo' });
    assert.deepEqual(response.body.map(e => e.id), [4]);
  });
  await t.test('una combinación sin coincidencias devuelve 200 y array vacío', async () => {
    const response = await request(app.getHttpServer()).get('/eventos').query({ ciudad: 'Madrid', categoria: 'Musica' }).expect(200);
    assert.deepEqual(response.body, []);
  });
  await t.test('rechaza parámetros repetidos o demasiado largos antes de consultar', async () => {
    const antes = consultas;
    await request(app.getHttpServer()).get('/eventos?ciudad=Zaragoza&ciudad=Madrid').expect(400);
    await request(app.getHttpServer()).get('/eventos?categoria=Musica&categoria=Tecnologia').expect(400);
    await request(app.getHttpServer()).get('/eventos').query({ ciudad: 'A'.repeat(121) }).expect(400);
    assert.equal(consultas, antes);
  });
});
