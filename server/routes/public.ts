import { Router } from 'express';
import { getDb } from '../db';
import { getLandingSettings } from '../services/siteSettings';

/** Public data. Nothing private. */
export const publicRouter = Router();

publicRouter.get('/landing', async (_req, res) => {
  const db = await getDb();
  // Short cache: a price change shows within a minute
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json(await getLandingSettings(db));
});
