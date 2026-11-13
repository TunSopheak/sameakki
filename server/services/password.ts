import bcrypt from 'bcryptjs';

// Cost 10 takes ~60ms here. Cost 12 is 4x slower and makes login feel sluggish on small hosts.
const COST = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, COST);
