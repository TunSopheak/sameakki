import { z } from 'zod';
import type { Queryable } from '../db';
import { DEFAULT_LANDING_SETTINGS, LANDING_LIMITS, PRICE_TERMS, type LandingSettings } from '../../shared/landing';

const sponsorSchema = z.object({
  name: z.string().trim().min(1, 'A sponsor needs a name.').max(LANDING_LIMITS.sponsorName),
  url: z
    .string()
    .trim()
    .max(LANDING_LIMITS.url)
    .optional()
    .transform(v => v || undefined)
    .refine(v => !v || /^https?:\/\/\S+$/i.test(v), 'The link must start with http:// or https://'),
});

export const landingSettingsSchema = z.object({
  studentPrice: z.string().trim().max(LANDING_LIMITS.price),
  studentTerm: z.enum(PRICE_TERMS),
  studentNoteKm: z.string().trim().max(LANDING_LIMITS.note),
  studentNoteEn: z.string().trim().max(LANDING_LIMITS.note),
  maxMembers: z.number().int().min(1).max(LANDING_LIMITS.maxMembers),
  pilotOffer: z.boolean(),
  sponsors: z.array(sponsorSchema).max(LANDING_LIMITS.sponsors),
});

const KEY = 'landing';

export async function getLandingSettings(db: Queryable): Promise<LandingSettings> {
  try {
    const { rows } = await db.query('SELECT value FROM site_settings WHERE key = $1', [KEY]);
    const raw = rows[0]?.value;
    const stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const parsed = landingSettingsSchema.partial().safeParse(stored ?? {});
    return { ...DEFAULT_LANDING_SETTINGS, ...(parsed.success ? parsed.data : {}) } as LandingSettings;
  } catch {
    return DEFAULT_LANDING_SETTINGS;
  }
}

export async function saveLandingSettings(db: Queryable, settings: LandingSettings) {
  await db.query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [KEY, JSON.stringify(settings)]
  );
}
