"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function RecipeCard(props: { recipe: any; onCraft?: () => void; disabled?: boolean; inventoryById?: Record<string, { id: string; name: string; quantity: number }>; characterId?: string }) {
  const r = props.recipe;
  const inv = props.inventoryById || {};
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    if (!props.characterId) return;
    setBusy(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/crafting/unlock', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: props.characterId, recipeId: r.id }) });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Не удалось открыть рецепт');
      toast({ title: 'Рецепт изучен' });
      // optimistically clear lock
      (r as any).locked = false;
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Попробуйте позже' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{r.name}</div>
        {r.locked ? (
          <Button size="sm" variant="secondary" onClick={unlock} disabled={busy || !props.characterId}>Открыть (1 очко)</Button>
        ) : (
          <Button size="sm" onClick={props.onCraft} disabled={props.disabled}>Скрафтить</Button>
        )}
      </div>
      <div className="text-xs text-muted-foreground">Требуется навык: {r.skillReq ?? 0}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs">Вход:</span>
        {(r.inputs || []).map((i: any) => {
          const have = inv[i.id]?.quantity || 0;
          const ok = have >= (i.quantity || 0);
          return (
            <Badge key={i.id} variant={ok ? 'secondary' : 'destructive'} className={`text-[10px] ${ok ? 'bg-emerald-600 text-white hover:bg-emerald-600' : ''}`}>{i.name || i.id} ×{i.quantity}</Badge>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs">Выход:</span>
        {(r.outputs || []).map((o: any) => (
          <Badge key={o.id} className="text-[10px]">{o.name || o.id} ×{o.quantity}</Badge>
        ))}
      </div>
    </Card>
  );
}


