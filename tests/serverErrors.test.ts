// Every fixed message the server can send must have a Khmer text, so the screen never mixes languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_ERRORS_KM, localizeError } from '../client/src/locales/serverErrors';

const IGNORED = new Set(['API route not found.', 'Malformed JSON body.']);

// A single-quoted string, allowing \' inside
const QUOTED = String.raw`'((?:[^'\\]|\\.)*)'`;
const HELPER_CALL = new RegExp(String.raw`(?:badRequest|conflict|notFound|forbidden|unauthorized)\(${QUOTED}`, 'g');
const ZOD_MESSAGE = new RegExp(String.raw`\.min\(\d+, ${QUOTED}`, 'g');
const CONSTANT = new RegExp(String.raw`^(?:export )?const [A-Z_]+ = ${QUOTED};`, 'g');
const ANY_STRING = new RegExp(QUOTED, 'g');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

function serverMessages(): string[] {
  const found = new Set<string>();
  const text = (s: string) => s.replace(/\\'/g, "'");
  for (const file of sourceFiles('server')) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      for (const regex of [HELPER_CALL, ZOD_MESSAGE, CONSTANT]) {
        for (const m of line.matchAll(regex)) found.add(text(m[1]));
      }
      if (line.includes('assert(')) {
        // The message is the last string on the line
        const last = [...line.matchAll(ANY_STRING)].pop();
        if (last && last[1].includes(' ')) found.add(text(last[1]));
      }
    }
  }
  // Keys, codes and other constants are one word; messages are sentences
  return [...found].filter(m => m.includes(' ') && !IGNORED.has(m)).sort();
}

test('every server message has a Khmer text', () => {
  const missing = serverMessages().filter(m => !SERVER_ERRORS_KM[m]);
  assert.deepEqual(missing, []);
});

test('Khmer texts are used in Khmer, and English is left alone', () => {
  assert.equal(localizeError('Task not found.', 'km'), SERVER_ERRORS_KM['Task not found.']);
  assert.equal(localizeError('Task not found.', 'en'), 'Task not found.');
  assert.equal(
    localizeError('startDate: The start date cannot be after the due date.', 'km'),
    SERVER_ERRORS_KM['The start date cannot be after the due date.']
  );
  assert.match(localizeError('Group code "GRP-ABC123" is already in use.', 'km'), /GRP-ABC123/);
  assert.match(localizeError('This group has reached its limit of 5 members. Contact the admin on Telegram to upgrade.', 'km'), /5/);
  assert.equal(localizeError('Something new.', 'km'), 'Something new.');
});
