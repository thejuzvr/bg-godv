import * as storage from '../storage';

type Update = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
};

async function sendMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const enabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
  if (!token || !enabled) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

async function handleText(chatId: string, text: string) {
  const t = text.trim();
  if (t.startsWith('/start ')) {
    const token = t.split(' ')[1] || '';
    const row = await storage.consumeTelegramLinkToken(token);
    if (!row) return;
    await storage.upsertTelegramSubscription((row as any).userId, String(chatId), 'daily', 'ru');
    await sendMessage(String(chatId), 'Газета Тамриэля: подписка оформлена!');
  } else if (t === '/unsubscribe') {
    const subs = await storage.getActiveTelegramSubscriptions();
    const mine = (subs as any[]).filter(s => String((s as any).chatId) === String(chatId));
    for (const s of mine) await storage.deactivateTelegramSubscription((s as any).id);
    await sendMessage(String(chatId), 'Газета Тамриэля: подписка отключена.');
  } else if (t === '/help') {
    await sendMessage(String(chatId), 'Газета Тамриэля — /start <код>, /unsubscribe, /help');
  } else if (t === '/testdigest') {
    try {
      const subs = await storage.getActiveTelegramSubscriptions();
      const me = (subs as any[]).find(s => String((s as any).chatId) === String(chatId));
      if (me) {
        const { buildDailyDigest } = await import('../digest/digestService');
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const text = await buildDailyDigest((me as any).userId, since) || 'Сегодня герой вёл себя тихо. Проверка связи Газеты Тамриэля.';
        await sendMessage(String(chatId), text);
      } else {
        await sendMessage(String(chatId), 'Подписка не найдена. Нажмите «Привязать Telegram» в профиле и выполните /start.');
      }
    } catch {
      await sendMessage(String(chatId), 'Не удалось сформировать тестовый дайджест.');
    }
  } else if (t === '/start') {
    await sendMessage(String(chatId), 'Здравствуйте! Чтобы связать аккаунт, нажмите «Привязать Telegram» в профиле игры.');
  }
}

export async function startTelegramPoller(): Promise<never> {
  const polling = String(process.env.TELEGRAM_POLLING || '').toLowerCase() === 'true';
  if (!polling) {
    // never exit
    await new Promise(() => {});
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[TelegramPoller] No TELEGRAM_BOT_TOKEN');
    await new Promise(() => {});
  }
  console.log('[TelegramPoller] Starting long polling...');
  let offset = 0;
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=30&offset=${offset}`);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      const data = await res.json().catch(() => null) as { ok: boolean; result?: Update[] } | null;
      const updates = data?.result || [];
      for (const u of updates) {
        offset = Math.max(offset, (u.update_id || 0) + 1);
        const text = u.message?.text;
        const chatId = u.message?.chat?.id;
        if (text && chatId) await handleText(String(chatId), text);
      }
    } catch (e) {
      console.error('[TelegramPoller] Error', e);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}


