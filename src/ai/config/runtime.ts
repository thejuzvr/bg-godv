import { getRedis } from '../../../server/redis';
import { AI_BT_ENABLED, ARRIVAL_WINDOW_MS, STALL_WINDOW_MS } from './constants';

export type BtSettings = {
  enabled: boolean;
  arrivalWindowMs: number;
  stallWindowMs: number;
};

export async function getBtSettings(): Promise<BtSettings> {
  try {
    const r = getRedis();
    const [enabledStr, arrivalStr, stallStr] = await r.mget('ai:bt:enabled', 'ai:bt:arrival_ms', 'ai:bt:stall_ms');
    const enabled = typeof enabledStr === 'string' ? ['1','true','on','yes'].includes(enabledStr.toLowerCase()) : AI_BT_ENABLED;
    const arrival = Number(arrivalStr || ARRIVAL_WINDOW_MS);
    const stall = Number(stallStr || STALL_WINDOW_MS);
    return {
      enabled: Number.isFinite(arrival) && Number.isFinite(stall) ? enabled : AI_BT_ENABLED,
      arrivalWindowMs: Number.isFinite(arrival) ? arrival : ARRIVAL_WINDOW_MS,
      stallWindowMs: Number.isFinite(stall) ? stall : STALL_WINDOW_MS,
    };
  } catch {
    return { enabled: AI_BT_ENABLED, arrivalWindowMs: ARRIVAL_WINDOW_MS, stallWindowMs: STALL_WINDOW_MS };
  }
}

export async function setBtSettings(settings: Partial<BtSettings>): Promise<void> {
  const r = getRedis();
  const ops: Array<string> = [];
  if (settings.enabled != null) ops.push('ai:bt:enabled', settings.enabled ? '1' : '0');
  if (settings.arrivalWindowMs != null) ops.push('ai:bt:arrival_ms', String(settings.arrivalWindowMs));
  if (settings.stallWindowMs != null) ops.push('ai:bt:stall_ms', String(settings.stallWindowMs));
  if (ops.length > 0) {
    await (r as any).mset(...ops);
  }
}


