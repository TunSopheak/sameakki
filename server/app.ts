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
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
