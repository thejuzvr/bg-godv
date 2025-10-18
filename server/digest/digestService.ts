import * as storage from '../storage';

function clampText(input: string, maxLen: number): string {
  if (input.length <= maxLen) return input;
  return input.slice(0, Math.max(0, maxLen - 1)) + '…';
}

export async function buildDailyDigest(userId: string, sinceTs: number): Promise<string | null> {
  const character = await storage.getCharacterById(userId);
  if (!character) return null;

  const [events, chron] = await Promise.all([
    storage.getRecentOfflineEvents(userId, 80),
    storage.getChronicleEntries(userId, 50),
  ]);

  const sinceChron = chron.filter((c: any) => (c as any).timestamp >= sinceTs);
  const highlights: string[] = [];
  for (const c of sinceChron) {
    const type = (c as any).type;
    if (type === 'level_up' || type === 'death' || type?.startsWith('unique')) {
      highlights.push(`${(c as any).title}: ${(c as any).description}`);
    }
    if (highlights.length >= 3) break;
  }

  const funny: string[] = [];
  for (const e of events) {
    const msg = (e as any).message || '';
    if (msg.length < 20) continue;
    if (/скума|выпил|смешн|шутк|дракон|ограбил|сундук|сгорел|упал/i.test(msg)) {
      funny.push(msg);
    }
    if (funny.length >= 6) break;
  }

  const level = (character as any).level;
  const location = (character as any).location;
  const status = (character as any).status;
  const hp = (character as any).stats?.health?.current;

  const parts: string[] = [];
  parts.push(`Дневной дайджест героя ${character.name}`);
  parts.push(`Сейчас: лвл ${level}, локация: ${location}, состояние: ${status}, HP: ${hp}`);
  if (highlights.length > 0) {
    parts.push('Важное:');
    for (const h of highlights) parts.push(`• ${h}`);
  }
  if (funny.length > 0) {
    parts.push('Занесём в летопись:');
    for (const f of funny) parts.push(`— ${f}`);
  }
  if (parts.length <= 2) parts.push('Сегодня герой вёл себя подозрительно тихо. Наверное, копил силы.');

  const text = parts.join('\n');
  return clampText(text, 900);
}


