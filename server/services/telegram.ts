import { timingSafeEqual } from 'node:crypto';

/**
 * Optional Telegram messages. Everything here does nothing unless TELEGRAM_BOT_TOKEN is set, so the app works the same without it.
 *
 * How a person connects: Sameakki makes a one-time link  https://t.me/<bot>?start=<token>.
 * Pressing Start in Telegram makes Telegram call our webhook with "/start <token>", and we store the chat id.
 * Messages go to that chat id. The person can disconnect at any time.
 */

const env = () => process.env;

export const telegramConfigured = () => !!env().TELEGRAM_BOT_TOKEN;
export const telegramBotUsername = () => (env().TELEGRAM_BOT_USERNAME ?? '').replace(/^@/, '');

/** Webhook calls must carry the secret we gave Telegram when registering the webhook. */
export function webhookSecretValid(received: string | undefined): boolean {
  const secret = env().TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !received) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Sends a text message. Returns false when it could not be sent. It never throws. */
export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = env().TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** The token in "/start <token>" (people may also press the Start button, which sends the same text) */
export function startToken(text: string | undefined): string | null {
  const match = text?.trim().match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{16,64})$/);
  return match ? match[1] : null;
}

export const isStop = (text: string | undefined) => /^\/stop(?:@\w+)?$/.test(text?.trim() ?? '');

/** The poke message, in both languages so nobody has to guess */
export function pokeMessage(args: { from: string; group: string; streak: number; appUrl?: string }): string {
  const km = args.streak > 0
    ? `👋 ${args.from} បាន Poke អ្នកក្នុង «${args.group}»។ អ្នកមិនទាន់បង្ហោះ ToDo ថ្ងៃនេះទេ។ បង្ហោះឥឡូវ ដើម្បីរក្សា 🔥 ${args.streak} ថ្ងៃ!`
    : `👋 ${args.from} បាន Poke អ្នកក្នុង «${args.group}»។ អ្នកមិនទាន់បង្ហោះ ToDo ថ្ងៃនេះទេ។ បង្ហោះឥឡូវ ដើម្បីចាប់ផ្តើម 🔥 ថ្មី!`;
  const en = args.streak > 0
    ? `👋 ${args.from} poked you in "${args.group}". You have not posted your ToDo today. Post now to keep your 🔥 ${args.streak}-day streak!`
    : `👋 ${args.from} poked you in "${args.group}". You have not posted your ToDo today. Post now to start a new 🔥 streak!`;
  return [km, en, args.appUrl].filter(Boolean).join('\n\n');
}
