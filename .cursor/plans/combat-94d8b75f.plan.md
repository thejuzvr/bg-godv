<!-- 94d8b75f-dd8c-4bf1-9227-e297db61116d 310eac6b-6820-4588-b633-3b4274c7af5e -->
# Combat analytics on dashboard analytics page

## Target files

- `src/app/dashboard/analytics/page.tsx` — add a new “Боевые отчеты” section
- `src/app/dashboard/shared-actions.ts` — add server helpers to fetch summary and recent battles
- `src/app/api/combat-analytics/route.ts` — API endpoint returning summary and recent (if we keep page as Client Component)
- `src/services/combatAnalyticsService.ts` — reuse `getRecentCombatAnalytics`, `getCombatStatsSummary`
- `src/types/character.ts` — no changes; define local UI types if needed

## Data we will show (from DB columns)

- Summary (from `getCombatStatsSummary`): `totalBattles, victories, defeats, flees, winRate, avgDamageDealt, avgDamageTaken, avgRoundsPerBattle, totalXpGained`
- Recent battles (from `getRecentCombatAnalytics`): `timestamp, enemyName, enemyLevel, victory, fled, roundsCount, damageDealt, damageTaken, xpGained, combatLog`

## Implementation steps

1) Server: expose data for client

- Add API route `GET /api/combat-analytics?characterId=...` returning `{ summary, recent }` using `getCombatStatsSummary` and `getRecentCombatAnalytics`.
- Alternatively, create server helpers in `src/app/dashboard/shared-actions.ts` and fetch via `fetch('/api/...')` from the client page.

2) Client UI: add “Боевые отчеты” section to `page.tsx`

- Fetch `{ summary, recent }` in `useEffect` after `user` and `character` are ready.
- Render summary cards using existing `Card` components:
  - "Всего боёв", "Победы", "Поражения", "Побеги", "Win rate", "Средн. нанесённый урон", "Средн. полученный урон", "Средн. раундов", "Всего XP".
- Render a table of recent battles with columns: Дата/время, Враг, Уровень, Результат, Раунды, Нанесено, Получено, XP, Лог.
- Add a Dialog/Drawer to show `combatLog` for a selected battle.

3) Charts (optional but recommended)

- Bar chart (Recharts) for last N battles: two bars per battle (Dealt vs Taken).
- Line chart for rounds per battle over time.

## Essential code snippets

- API handler skeleton:
```ts
// src/app/api/combat-analytics/route.ts
import { NextResponse } from 'next/server';
import { getCombatStatsSummary, getRecentCombatAnalytics } from '@/services/combatAnalyticsService';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');
  if (!characterId) return NextResponse.json({ error: 'characterId required' }, { status: 400 });
  const [summary, recent] = await Promise.all([
    getCombatStatsSummary(characterId),
    getRecentCombatAnalytics(characterId, 10),
  ]);
  return NextResponse.json({ summary, recent });
}
```

- Client fetch in `page.tsx`:
```ts
useEffect(() => {
  if (!user) return;
  const loadCombat = async () => {
    const res = await fetch(`/api/combat-analytics?characterId=${user.userId}`, { cache: 'no-store' });
    const data = await res.json();
    setCombatSummary(data.summary);
    setRecentBattles(data.recent);
  };
  loadCombat();
}, [user]);
```

- Recent battles table row result derivation:
```ts
const result = b.fled ? 'Побег' : (b.victory ? 'Победа' : 'Поражение');
```

- Dialog to display `combatLog`:
```tsx
<Dialog>
  <DialogTrigger>Лог</DialogTrigger>
  <DialogContent>
    <pre className="whitespace-pre-wrap text-sm">{b.combatLog.join('\n')}</pre>
  </DialogContent>
</Dialog>
```


## Rollout

- Implement API route and page UI in one PR.
- Test with a character having at least 1-2 recorded battles.
- Later enhancements: filters (period, result), export log, per-enemy aggregation and winrate.

### To-dos

- [ ] Add damage taken/dealt counters across hits, spells, crit self-damage
- [ ] Add 30-round cap with escape/draw outcome in performCombatRound
- [ ] Warn/log when combat reaches 20 rounds
- [ ] Aggregate all damage sources and rounds in combat analytics
- [ ] Increase wanderAction thought chance to 30%
- [ ] Allow travel after 5+ stagnant ticks by lifting penalty
- [ ] Implement readiness vs threat scorer for findEnemyAction
- [ ] Wrap character save/fetch in txn with SELECT FOR UPDATE
- [ ] Extract round cap and thresholds into constants/config
- [ ] Manual verification: sample combats reflect analytics and caps