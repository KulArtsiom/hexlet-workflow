// @ts-check

const forwardedHeaderNames = [
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'via',
];

const journeySteps = [
  {
    title: 'GitHub Actions',
    note: 'CI: сборка, тесты, линтер',
    done: true,
  },
  {
    title: 'Docker',
    note: 'Образ приложения, публикация в Docker Hub',
    done: true,
  },
  {
    title: 'Caddy',
    note: 'Реверс-прокси, HTTPS, раздача статики',
    done: true,
  },
  {
    title: 'Продакшен',
    note: 'Релизы и деплой Ансиблом одной командой',
    done: true,
  },
  {
    title: 'Мониторинг',
    note: 'Sentry, логи, алерты',
    done: false,
  },
];

export default (app) => {
  app.get('/', (_req, reply) => {
    const serverMessage = process.env.SERVER_MESSAGE;

    reply.view('index', { serverMessage, steps: journeySteps });
  });

  app.get('/proxy', { name: 'proxy' }, (req, reply) => {
    const forwardedHeaders = forwardedHeaderNames
      .map((name) => ({ name, value: req.headers[name] }))
      .filter(({ value }) => value);

    reply.view('proxy', {
      throughProxy: forwardedHeaders.length > 0,
      forwardedHeaders,
      host: req.headers.host,
      clientIp: req.ip,
    });
  });

  app.get('/health', { name: 'health' }, () => ({
    status: 'ok',
    uptime: Math.round(process.uptime()),
  }));

  app.get('/error', { name: 'error' }, () => {
    throw new Error('Oops! Something went wrong!');
  });
};
