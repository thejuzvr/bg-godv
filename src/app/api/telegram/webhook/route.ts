import { NextResponse } from 'next/server';
import * as storage from '../../../../server/storage';

async function reply(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const enabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
  if (!token || !enabled) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {}
}

function ok() { return NextResponse.json({ ok: true }); }

export async function POST(req: Request) {
  const secret = (req.headers.get('x-telegram-bot-api-secret-token') || '');
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return ok();
  }
  const enabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
  if (!enabled) return ok();

  const update = await req.json().catch(() => null);
  if (!update) return ok();
  const message = update.message || update.edited_message;
  if (!message) return ok();
  const chatId = String(message.chat?.id || '');
  const text: string = String(message.text || '').trim();

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const token = parts[1] || '';
    if (!token) return ok();
    const tokenRow = await storage.consumeTelegramLinkToken(token);
    if (!tokenRow) return ok();
    const userId = (tokenRow as any).userId as string;
    await storage.upsertTelegramSubscription(userId, chatId, 'daily', 'ru');
    await reply(chatId, 'Газета Тамриэля: подписка оформлена! Вы будете получать ежедневный дайджест приключений вашего героя.');
  } else if (text.startsWith('/unsubscribe')) {
    // deactivate all subs for this chat
    const subs = await storage.getActiveTelegramSubscriptions();
    const mine = (subs as any[]).filter(s => String((s as any).chatId) === chatId);
    for (const s of mine) await storage.deactivateTelegramSubscription((s as any).id);
    await reply(chatId, 'Газета Тамриэля: подписка отключена. Возвращайтесь, когда соскучитесь по новостям.');
  } else if (text === '/testdigest') {
    try {
      const subs = await storage.getActiveTelegramSubscriptions();
      const me = (subs as any[]).find(s => String((s as any).chatId) === chatId);
      if (me) {
        const { buildDailyDigest } = await import('../../../../server/digest/digestService');
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const text = await buildDailyDigest((me as any).userId, since) || 'Сегодня герой вёл себя тихо. Проверка связи Газеты Тамриэля.';
        await reply(chatId, text);
      } else {
        await reply(chatId, 'Подписка не найдена. Нажмите «Привязать Telegram» в профиле и выполните /start.');
      }
    } catch {
      await reply(chatId, 'Не удалось сформировать тестовый дайджест.');
    }
  } else if (text === '/help') {
    await reply(chatId, 'Газета Тамриэля — короткие сводки из жизни вашего героя. Команды: /start <код>, /unsubscribe, /help');
  } else if (text === '/start' || text === '/menu') {
    await reply(chatId, 'Добро пожаловать в Газету Тамриэля! Чтобы связать аккаунт, нажмите "Привязать Telegram" в профиле игры.');
  }
  return ok();
}


