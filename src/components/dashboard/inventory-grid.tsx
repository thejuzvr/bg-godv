"use client";

import type { Character } from "@/types/character";
import { Card, CardContent } from "@/components/ui/card";

type InventoryItem = Character["inventory"][number];

export function InventoryGrid({
  items,
  gameData,
  onItemClick,
  filter,
}: {
  items: InventoryItem[];
  gameData?: any;
  onItemClick?: (item: InventoryItem) => void;
  filter?: (item: InventoryItem) => boolean;
}) {
  const visible = (items || [])
    .filter(i => i && i.id)
    .filter(i => i.id !== 'gold')
    .filter(i => (filter ? filter(i) : true));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 font-body">
      {visible.map((it, idx) => {
        const base = gameData?.items?.find((x: any) => x.id === it.id);
        const name = base?.name || it.name || it.id;
        return (
          <button key={idx} onClick={() => onItemClick && onItemClick(it)} className="text-left">
            <Card className="hover:bg-muted/40 transition">
              <CardContent className="p-3">
                <div className="text-sm font-medium truncate font-headline">{name}</div>
                <div className="text-xs text-muted-foreground">x{it.quantity}</div>
              </CardContent>
            </Card>
          </button>
        );
      })}
      {visible.length === 0 && (
        <div className="text-sm text-muted-foreground">Нет подходящих предметов.</div>
      )}
    </div>
  );
}


