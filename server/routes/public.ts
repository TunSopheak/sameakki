import { Router } from 'express';
import { getDb } from '../db';
import { getLandingSettings } from '../services/siteSettings';

/** Things anyone may read without signing in. Nothing private goes here. */
export const publicRouter = Router();

publicRouter.get('/landing', async (_req, res) => {
  const db = await getDb();
  // A short cache keeps the landing page quick, and a price change shows within a minute
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json(await getLandingSettings(db));
});
