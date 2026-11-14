import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';

// Cost 10 takes ~60ms here. Cost 12 is 4x slower and makes login feel sluggish on small hosts.
const COST = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);

// No 0/O or 1/I/l, so a password is easy to read out over the phone
const PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
/** A random temporary password. The person is made to change it at first sign-in. */
export const generatePassword = () =>
  Array.from({ length: 10 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join('');
