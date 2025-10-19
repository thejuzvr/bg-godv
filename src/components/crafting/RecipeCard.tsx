"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function RecipeCard(props: { recipe: any; onCraft?: () => void; disabled?: boolean; inventoryById?: Record<string, { id: string; name: string; quantity: number }> }) {
  const r = props.recipe;
  const inv = props.inventoryById || {};
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{r.name}</div>
        <Button size="sm" onClick={props.onCraft} disabled={props.disabled}>Скрафтить</Button>
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


