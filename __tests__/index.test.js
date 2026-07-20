import fastify from 'fastify';
import _ from 'lodash';

import init from '../server/plugin.js';

describe('app', () => {
  let app;

  beforeAll(async () => {
    app = fastify();
    await init(app);
  });

  it('main page without environment variable SERVER_MESSAGE', async () => {
    _.unset(process.env, 'SERVER_MESSAGE');
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch('Приложение работает!');
    expect(res.body).toMatch('Переменная SERVER_MESSAGE не установлена');
  });

  it('main page with environment variable SERVER_MESSAGE', async () => {
    process.env.SERVER_MESSAGE = 'Hexlet Awesome Server';

    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch('Приложение работает!');
    expect(res.body).toMatch(
      `Сообщение сервера: ${process.env.SERVER_MESSAGE}`,
    );
  });

  it('health endpoint', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('proxy page detects direct request', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/proxy',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch('Запрос пришёл напрямую.');
  });

  it('proxy page detects request through proxy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/proxy',
      headers: {
        'x-forwarded-for': '203.0.113.5',
        'x-forwarded-proto': 'https',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch('Запрос пришёл через прокси.');
    expect(res.body).toMatch('203.0.113.5');
  });
});
