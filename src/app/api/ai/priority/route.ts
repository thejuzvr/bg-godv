import { NextRequest } from 'next/server';
import * as storage from '@/../server/storage';

// Simple in-memory cache per instance; in production replace with Redis
const mem: Record<string, { until: number; boost: number }> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = String(body.characterId || '').trim();
    const actionType = String(body.actionType || '').trim();
    const priorityBoost = Number(body.priorityBoost || 1);
    const durationMs = Number(body.durationMs || 5 * 60 * 1000);
    if (!characterId || !actionType || !Number.isFinite(priorityBoost) || priorityBoost <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_args' }), { status: 400 });
    }
    const key = `${characterId}:${actionType}`;
    mem[key] = { until: Date.now() + Math.max(10_000, durationMs), boost: Math.min(5, priorityBoost) };
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown' }), { status: 500 });
  }
}

// Helper function to get priority boost (not a Server Action)
export function getPriorityBoost(characterId: string, actionType: string): number {
  const key = `${characterId}:${actionType}`;
  const rec = mem[key];
  if (!rec) return 1;
  if (Date.now() > rec.until) { delete mem[key]; return 1; }
  return rec.boost || 1;
}


