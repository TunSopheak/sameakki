import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeNotification } from '../shared/notificationText';
import { NOT_FOR_TELEGRAM, isStop, notificationMessage, pokeMessage, startToken, webhookSecretValid } from '../server/services/telegram';

test('the app and Telegram say the same thing, in the chosen language', () => {
  const n = { type: 'task_assigned' as const, actorName: 'Dara', params: { title: 'Login screen', dueDate: '2026-11-20' } };
  assert.equal(describeNotification(n, 'en').text, 'Dara assigned you "Login screen" (due 2026-11-20)');
  assert.match(describeNotification(n, 'km').text, /Dara .*«Login screen».*2026-11-20/);
  assert.equal(describeNotification({ type: 'task_approved', actorName: '', params: { title: 'X', feedback: 'Well done' } }, 'en').note, 'Well done');
});

test('a Telegram message has the text, the leader note and the app link', () => {
  assert.equal(notificationMessage({ text: 'Dara approved your task "X"', note: 'Well done' }, 'https://app.example'), 'Dara approved your task "X"\n“Well done”\nhttps://app.example');
  assert.equal(notificationMessage({ text: 'Hello' }), 'Hello', 'no note and no link');
});

test('the poke message is in one language and names the streak', () => {
  const base = { from: 'Dara', group: 'Team A', streak: 5 };
  const en = pokeMessage({ ...base, language: 'en' });
  assert.match(en, /Dara poked you in "Team A"/);
  assert.match(en, /5-day streak/);
  assert.ok(!/[ក-៿]/.test(en), 'English only');
  const km = pokeMessage({ ...base, language: 'km', appUrl: 'https://app.example' });
  assert.match(km, /Dara បាន Poke អ្នក/);
  assert.match(km, /5 ថ្ងៃ/);
  assert.ok(km.endsWith('https://app.example'));
  assert.match(pokeMessage({ ...base, streak: 0, language: 'en' }), /start a new/);
});

test('what stays out of Telegram: reactions, reminders, password resets (pokes have their own message)', () => {
  for (const type of ['daily_reaction', 'task_due_soon', 'task_overdue', 'password_reset', 'poke']) assert.ok(NOT_FOR_TELEGRAM.includes(type), type);
  for (const type of ['task_assigned', 'task_ready_for_review', 'task_approved', 'task_changes_requested', 'comment_added']) assert.ok(!NOT_FOR_TELEGRAM.includes(type), type);
});

test('the start command carries a one-time token, and /stop disconnects', () => {
  assert.equal(startToken('/start AbCdEfGhIjKlMnOpQrSt'), 'AbCdEfGhIjKlMnOpQrSt');
  assert.equal(startToken('/start@SameakkiBot AbCdEfGhIjKlMnOpQrSt'), 'AbCdEfGhIjKlMnOpQrSt');
  assert.equal(startToken('/start'), null, 'pressing Start with no link carries nothing');
  assert.equal(startToken('/start short'), null);
  assert.equal(startToken('hello AbCdEfGhIjKlMnOpQrSt'), null);
  assert.ok(isStop('/stop') && isStop('/stop@SameakkiBot') && !isStop('stop it'));
});

test('the webhook only trusts the secret we gave Telegram', () => {
  const before = process.env.TELEGRAM_WEBHOOK_SECRET;
  try {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    assert.equal(webhookSecretValid('anything'), false, 'no secret set means nothing is trusted');
    process.env.TELEGRAM_WEBHOOK_SECRET = 's3cret-value';
    assert.equal(webhookSecretValid('s3cret-value'), true);
    assert.equal(webhookSecretValid('s3cret-valuf'), false);
    assert.equal(webhookSecretValid('s3cret'), false, 'a different length');
    assert.equal(webhookSecretValid(undefined), false);
  } finally {
    if (before === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
    else process.env.TELEGRAM_WEBHOOK_SECRET = before;
  }
});
