import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { getDb } from './db';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundApi } from './middleware/errors';
import { authRouter } from './routes/auth';
import { bootstrapRouter } from './routes/bootstrap';
import { groupsRouter } from './routes/groups';
import { usersRouter } from './routes/users';
import { tasksRouter } from './routes/tasks';
import { dailyLogsRouter } from './routes/dailyLogs';
import { adminRouter } from './routes/admin';
import { notificationsRouter } from './routes/notifications';
import { commentsRouter } from './routes/comments';
import { publicRouter } from './routes/public';

// Addresses the app answers itself (older links to the login and about pages still work)
const APP_PATHS = new Set(['/', '/login', '/about']);

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render/Railway/Fly/NGINX load balancers

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          // The host handles HTTPS; this directive would break plain-HTTP setups.
          'upgrade-insecure-requests': null,
        },
      },
    })
  );
  app.use(compression());
  if (config.corsOrigins.length > 0) {
    app.use('/api', cors({ origin: config.corsOrigins, credentials: true }));
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // No database call here, so health checks do not wake Neon
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/health/db', async (_req, res) => {
    try {
      const db = await getDb();
      await db.query('SELECT 1');
      res.json({ ok: true, db: db.kind });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/public', publicRouter);
  const api = express.Router();
  api.use(requireAuth);
  api.use(bootstrapRouter, groupsRouter, usersRouter, tasksRouter, dailyLogsRouter, adminRouter, notificationsRouter, commentsRouter);
  app.use('/api', api);
  app.use('/api', notFoundApi);

  const indexHtml = path.join(config.clientDistDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const template = fs.readFileSync(indexHtml, 'utf8');
    // Addresses in the page (canonical, share image) follow the host the visitor used
    const originOf = (req: express.Request) => {
      const host = req.get('host') ?? '';
      return /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? `${req.protocol}://${host}` : '';
    };

    app.get('/robots.txt', (req, res) => {
      res.type('text/plain').send(['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${originOf(req)}/sitemap.xml`, ''].join('\n'));
    });
    app.get('/sitemap.xml', (req, res) => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${originOf(req)}/</loc></url></urlset>`;
      res.type('application/xml').send(xml);
    });

    // Hashed assets are cached for a year
    app.use(
      express.static(config.clientDistDir, {
        index: false,
        setHeaders: (res, filePath) => {
          const hashed = filePath.includes(`${path.sep}assets${path.sep}`);
          res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
        },
      })
    );
    // Other GET requests return the app (not cached)
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      // Any address the app does not know is a 404 for search engines; people still see the app
      res.status(APP_PATHS.has(req.path.replace(/\/+$/, '') || '/') ? 200 : 404);
      res.type('html').send(template.replaceAll('__ORIGIN__', originOf(req)));
    });
  }

  app.use(errorHandler);
  return app;
}
