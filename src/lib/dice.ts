export type D20Outcome<T> = {
  low: T; // 1-7
  mid: T; // 8-14
  high: T; // 15-20
};

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollD20Adv(options?: { advantage?: boolean; disadvantage?: boolean }): { roll: number; raw: number[] } {
  const a = rollD20();
  const b = rollD20();
  const adv = !!options?.advantage;
  const dis = !!options?.disadvantage;
  // Net out stacking (adv+dis => normal)
  if (adv && !dis) {
    return { roll: Math.max(a, b), raw: [a, b] };
  }
  if (dis && !adv) {
    return { roll: Math.min(a, b), raw: [a, b] };
  }
  return { roll: a, raw: [a] };
}

export function mapD20<T>(roll: number, outcomes: D20Outcome<T>): T {
  if (roll <= 7) return outcomes.low;
  if (roll <= 14) return outcomes.mid;
  return outcomes.high;
}

// Very small dice roller supporting expressions like "1d8", "2d6+3", "1d12-1"
export function rollDiceExpression(expr: string): { total: number; rolls: number[] } {
  // Normalize and parse
  const m = expr.trim().match(/^(\d+)[dD](\d+)([+-]\d+)?$/);
  if (!m) {
    // Fallback: treat as flat number
    const n = Number(expr);
    return { total: Number.isFinite(n) ? n : 0, rolls: [] };
  }
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    sum += r;
  }
  sum += mod;
  return { total: sum, rolls };
}

