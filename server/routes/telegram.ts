import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { getDb } from '../db';
import { badRequest, notFound } from '../middleware/errors';
import { isStop, sendTelegram, startToken, telegramBotUsername, telegramConfigured, webhookSecretValid } from '../services/telegram';

const LINK_MINUTES = 15;

/** For a signed-in person: connect or disconnect their own Telegram. */
export const telegramRouter = Router();

telegramRouter.get('/telegram', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query('SELECT telegram_chat_id FROM users WHERE id = $1', [req.user!.id]);
  res.json({ available: telegramConfigured() && !!telegramBotUsername(), linked: !!rows[0]?.telegram_chat_id });
});

// A one-time link that opens the bot. Pressing Start there connects this account.
telegramRouter.post('/telegram/link', async (req, res) => {
  if (!telegramConfigured() || !telegramBotUsername()) throw badRequest('Telegram is not set up on this server.');
  const token = randomBytes(18).toString('base64url');
  const db = await getDb();
  await db.query(
    `UPDATE users SET telegram_link_token = $2, telegram_link_expires = now() + ($3::text || ' minutes')::interval WHERE id = $1`,
    [req.user!.id, token, LINK_MINUTES]
  );
  res.json({ url: `https://t.me/${telegramBotUsername()}?start=${token}`, minutes: LINK_MINUTES });
});

telegramRouter.delete('/telegram/link', async (req, res) => {
  const db = await getDb();
  await db.query('UPDATE users SET telegram_chat_id = NULL, telegram_link_token = NULL, telegram_link_expires = NULL WHERE id = $1', [req.user!.id]);
  res.status(204).end();
});

/** Called by Telegram itself. It has no login, so it is checked by the secret we gave Telegram. */
export const telegramWebhookRouter = Router();

telegramWebhookRouter.post('/telegram/webhook', async (req, res) => {
  if (!telegramConfigured()) throw notFound('Not found.');
  if (!webhookSecretValid(req.get('x-telegram-bot-api-secret-token'))) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const message = req.body?.message;
  const chatId = message?.chat?.id !== undefined ? String(message.chat.id) : '';
  // Only private chats, so a group chat can never be connected by accident
  if (!chatId || message?.chat?.type !== 'private') {
    res.json({ ok: true });
    return;
  }

  const db = await getDb();
  const token = startToken(message.text);
  if (token) {
    const { rows } = await db.query(
      `UPDATE users SET telegram_chat_id = $2, telegram_link_token = NULL, telegram_link_expires = NULL
        WHERE telegram_link_token = $1 AND telegram_link_expires > now() AND is_active = 1
        RETURNING name`,
      [token, chatId]
    );
    await sendTelegram(
      chatId,
      rows[0]
        ? `✅ ភ្ជាប់ជាមួយ Sameakki រួចរាល់ជាមួយគណនី ${rows[0].name}។ អ្នកនឹងទទួលការ Poke នៅទីនេះ។ វាយ /stop ដើម្បីផ្តាច់។\n\n✅ Connected to Sameakki as ${rows[0].name}. You will get pokes here. Send /stop to disconnect.`
        : '⚠️ តំណនេះផុតកំណត់ ឬប្រើរួចហើយ។ សូមបង្កើតតំណថ្មីក្នុង Sameakki។\n\n⚠️ This link expired or was already used. Make a new one in Sameakki.'
    );
  } else if (isStop(message.text)) {
    await db.query('UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = $1', [chatId]);
    await sendTelegram(chatId, '👋 បានផ្តាច់ហើយ។ / Disconnected.');
  } else {
    await sendTelegram(chatId, 'Sameakki → My settings → Connect Telegram\nសាមគ្គី → ការកំណត់របស់ខ្ញុំ → ភ្ជាប់ Telegram');
  }

  res.json({ ok: true });
});
