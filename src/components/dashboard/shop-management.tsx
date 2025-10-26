"use client";

import { useState } from "react";
import type { Character } from "@/types/character";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InventoryGrid } from "./inventory-grid";
import { Store, Plus, X, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShopManagement({ character, gameData, onUpdated }: { character: Character; gameData: any; onUpdated: (c: Character) => void }) {
  const [price, setPrice] = useState<number>(10);
  const [selected, setSelected] = useState<any | null>(null);
  const [isListing, setIsListing] = useState(false);
  const { toast } = useToast();

  async function listSelected() {
    if (!selected) return;
    
    setIsListing(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/shop/list-item', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, 
        body: JSON.stringify({ characterId: character.id, itemId: selected.id, quantity: 1, pricePerUnit: price }) 
      });
      const data = await resp.json();
      
      if (data.ok && data.character) {
        onUpdated(data.character);
        setSelected(null);
        toast({
          title: "Предмет выставлен",
          description: `${selected.name} теперь продаётся в вашей лавке за ${price} золота`,
        });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось выставить предмет",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выставить предмет",
        variant: "destructive",
      });
    } finally {
      setIsListing(false);
    }
  }

  async function removeItem(itemId: string) {
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/shop/remove-item', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, 
        body: JSON.stringify({ characterId: character.id, itemId }) 
      });
      const data = await resp.json();
      
      if (data.ok && data.character) {
        onUpdated(data.character);
        toast({
          title: "Предмет снят",
          description: "Предмет возвращён в инвентарь",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось снять предмет",
        variant: "destructive",
      });
    }
  }

  const shopInventory = character.preferences?.playerShop?.inventory || [];
  const totalListedValue = shopInventory.reduce((sum: number, item: any) => 
    sum + (item.pricePerUnit * item.quantity), 0
  );

  return (
    <div className="space-y-4">
      {/* Статистика лавки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Статистика лавки
          </CardTitle>
          <CardDescription>
            Обзор вашего торгового бизнеса
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Товаров выставлено</p>
              <p className="text-2xl font-bold">{shopInventory.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Общая стоимость</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <Coins className="h-5 w-5 text-amber-500" />
                {totalListedValue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Выставить предмет */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выставить предмет</CardTitle>
          <CardDescription>
            Выберите предмет из инвентаря и установите цену
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selected && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.type} • {selected.rarity || 'common'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2">
                <Label htmlFor="price" className="whitespace-nowrap">Цена:</Label>
                <Input 
                  id="price"
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} 
                  className="w-32"
                  min={1}
                />
                <span className="text-sm text-muted-foreground">золота</span>
                <Button 
                  onClick={listSelected} 
                  disabled={isListing}
                  className="ml-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Выставить
                </Button>
              </div>
            </div>
          )}
          <InventoryGrid 
            items={character.inventory.filter(i => i.id !== 'gold')} 
            gameData={gameData} 
            onItemClick={setSelected} 
          />
        </CardContent>
      </Card>

      {/* Выставленные товары */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выставленные товары</CardTitle>
          <CardDescription>
            Товары, доступные для покупки в вашей лавке
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shopInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                Нет выставленных товаров
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Выставите предметы, чтобы начать торговлю
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {shopInventory.map((e: any, idx: number) => {
                const item = gameData.items.find((i: any) => i.id === e.itemId);
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item?.name || e.itemId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          x{e.quantity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {item?.type || 'misc'}
                        </Badge>
                        <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {e.pricePerUnit} за шт.
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeItem(e.itemId)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Снять
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


