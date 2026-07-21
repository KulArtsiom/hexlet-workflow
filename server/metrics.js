// @ts-check

import client from 'prom-client';

// Отдельный реестр вместо глобального: так метриками приложения
// проще управлять и они не смешиваются с чужими.
const registry = new client.Registry();

// Метки, которые Prometheus увидит у каждой метрики приложения.
// Помогают отличить web1 от web2, если targets настроены без релейблинга.
registry.setDefaultLabels({
  app: 'devops-lab',
  instance_name: process.env.SERVER_MESSAGE ?? 'unknown',
});

// Стандартные метрики Node.js: CPU, память, heap, задержка event loop, GC.
// Собираются в момент скрейпа, отдельного таймера не заводят.
client.collectDefaultMetrics({ register: registry });

// Счётчик запросов. Суффикс _total — соглашение Prometheus для счётчиков.
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Общее количество HTTP-запросов',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// Гистограмма длительности. Базовая единица — секунды (тоже соглашение).
// Бакеты подобраны под быстрое веб-приложение: от 5 мс до 5 с.
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Длительность обработки HTTP-запроса в секундах',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export default (app) => {
  app.addHook('onResponse', (request, reply, done) => {
    // Берём ШАБЛОН маршрута ('/proxy'), а не сырой URL.
    // Иначе каждый уникальный путь плодил бы новую серию метрик —
    // это называется взрывом кардинальности и убивает Prometheus.
    const labels = {
      method: request.method,
      route: request.routeOptions?.url ?? 'unmatched',
      status_code: reply.statusCode,
    };

    httpRequestsTotal.inc(labels);
    // elapsedTime приходит в миллисекундах, переводим в секунды.
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000);

    done();
  });

  app.get('/metrics', { name: 'metrics' }, async (_request, reply) => {
    reply.header('Content-Type', registry.contentType);

    return registry.metrics();
  });
};
