import { z } from 'zod';

/** A real calendar day written as YYYY-MM-DD. "2025-02-30" and "2020-13-45" look right but are refused. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)')
  .refine(value => {
    // An impossible date such as the 13th month makes toISOString() throw, so check for that first
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'must be a real date');

/** A time of day written as HH:mm, from 00:00 to 23:59. */
export const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be a time (HH:mm)');
