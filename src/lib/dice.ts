export type D20Outcome<T> = {
  low: T; // 1-7
  mid: T; // 8-14
  high: T; // 15-20
};

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function mapD20<T>(roll: number, outcomes: D20Outcome<T>): T {
  if (roll <= 7) return outcomes.low;
  if (roll <= 14) return outcomes.mid;
  return outcomes.high;
}


