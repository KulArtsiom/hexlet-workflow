import fastify from 'fastify';

import init from '../server/plugin.js';

describe('metrics', () => {
  let app;

  beforeAll(async () => {
    app = fastify();
    await init(app);
  });

  it('exposes prometheus exposition format', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch('text/plain');
    // Стандартные метрики Node.js
    expect(res.body).toMatch('process_cpu_user_seconds_total');
    expect(res.body).toMatch('nodejs_heap_size_used_bytes');
  });

  it('counts handled requests with route template label', async () => {
    await app.inject({ method: 'GET', url: '/health' });

    const res = await app.inject({ method: 'GET', url: '/metrics' });

    expect(res.body).toMatch('http_requests_total');
    expect(res.body).toMatch('http_request_duration_seconds');
    // Метка route — шаблон маршрута, статус 200
    expect(res.body).toMatch(/http_requests_total\{[^}]*route="\/health"/);
    expect(res.body).toMatch(/http_requests_total\{[^}]*status_code="200"/);
  });

  it('labels unmatched routes without exploding cardinality', async () => {
    await app.inject({ method: 'GET', url: '/no-such-page-12345' });

    const res = await app.inject({ method: 'GET', url: '/metrics' });

    expect(res.body).toMatch(/route="unmatched"/);
    expect(res.body).not.toMatch('/no-such-page-12345');
  });
});
