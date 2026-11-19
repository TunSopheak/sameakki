import fs from 'node:fs';
import path from 'node:path';

/** The version in package.json. The app is started from the project folder, so the file is next to it. */
export const APP_VERSION: string = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
})();
