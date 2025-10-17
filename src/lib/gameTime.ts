// Shared global game time utilities

// 1 real hour -> 12 in-game hours (1 in-game day = 2 real hours)
export const REAL_TO_GAME_TIME_MULTIPLIER = 12;
export const REAL_EPOCH_MS = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
export const GAME_EPOCH_MS = Date.UTC(2025, 0, 1, 6, 0, 0, 0);

export function getGlobalGameDate(): number {
  const now = Date.now();
  const realDelta = Math.max(0, now - REAL_EPOCH_MS);
  // Allow override via env (client: NEXT_PUBLIC_GAME_TIME_MULTIPLIER)
  let mult = REAL_TO_GAME_TIME_MULTIPLIER;
  try {
    const envVal = (process.env.NEXT_PUBLIC_GAME_TIME_MULTIPLIER || process.env.GAME_TIME_MULTIPLIER) as string | undefined;
    const parsed = envVal ? Number(envVal) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 144) {
      mult = parsed;
    }
  } catch {}
  return GAME_EPOCH_MS + realDelta * mult;
}


