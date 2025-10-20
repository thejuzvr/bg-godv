"use client";

import { useState } from "react";
import type { Character } from "@/types/character";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InventoryGrid } from "./inventory-grid";

export function ShopManagement({ character, gameData, onUpdated }: { character: Character; gameData: any; onUpdated: (c: Character) => void }) {
  const [price, setPrice] = useState<number>(10);
  const [selected, setSelected] = useState<any | null>(null);

  async function listSelected() {
    if (!selected) return;
    const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
    const resp = await fetch('/api/shop/list-item', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, itemId: selected.id, quantity: 1, pricePerUnit: price }) });
    const data = await resp.json();
    if (data.ok && data.character) onUpdated(data.character);
  }

  async function removeItem(itemId: string) {
    const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
    const resp = await fetch('/api/shop/remove-item', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, itemId }) });
    const data = await resp.json();
    if (data.ok && data.character) onUpdated(data.character);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-base">Управление лавкой</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Выставить предмет</div>
          <InventoryGrid items={character.inventory} gameData={gameData} onItemClick={setSelected} />
          <div className="flex items-center gap-2">
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-40" />
            <Button onClick={listSelected} disabled={!selected}>Выставить за цену</Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Выставленные товары</div>
          <div className="space-y-2">
            {(character.preferences?.playerShop?.inventory || []).map((e, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span>{(gameData.items.find((i: any) => i.id === e.itemId)?.name) || e.itemId} x{e.quantity} — {e.pricePerUnit} золота</span>
                <Button variant="secondary" size="sm" onClick={() => removeItem(e.itemId)}>Снять</Button>
              </div>
            ))}
            {(character.preferences?.playerShop?.inventory || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Нет выставленных товаров.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


