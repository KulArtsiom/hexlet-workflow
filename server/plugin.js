// @ts-check

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import traps from '@dnlup/fastify-traps';
import fastifyStatic from '@fastify/static';
import pointOfView from '@fastify/view';
import * as Sentry from '@sentry/node';
import Pug from 'pug';

import registerMetrics from './metrics.js';
import addRoutes from './routes.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

const registerErrorHandler = (app) => {
  app.setErrorHandler((error, _request, reply) => {
    const { message: errorMessage } = error;

    Sentry.captureException(error);

    reply.status(500).view('500', { errorMessage });
  });
};

const registerPlugins = (app) => {
  app
    .register(fastifyStatic, {
      root: path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist'),
      prefix: '/assets/',
    })
    .register(fastifyStatic, {
      root: path.join(__dirname, '..', 'public'),
      prefix: '/',
      decorateReply: false,
    })
    .register(pointOfView, {
      engine: {
        pug: Pug,
      },
      includeViewExtension: true,
      templates: path.join(__dirname, '..', 'server', 'views'),
    })
    .register(traps, {
      onSignal(signal) {
        console.debug(`Received signal ${signal}`);
      },
    });
};

export default (app, _options) => {
  registerPlugins(app);
  // Метрики подключаем до маршрутов: хук onResponse должен
  // успеть навеситься на все запросы, включая /metrics.
  registerMetrics(app);
  addRoutes(app);
  registerErrorHandler(app);

  return app;
};

export const options = {
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
      },
    },
  },
};
