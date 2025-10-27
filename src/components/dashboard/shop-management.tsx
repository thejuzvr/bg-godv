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
import { Store, Plus, X, Coins, Loader2, Minus, TrendingUp, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ShopManagement({ character, gameData, onUpdated }: { character: Character; gameData: any; onUpdated: (c: Character) => void }) {
  const [price, setPrice] = useState<number>(10);
  const [quantity, setQuantity] = useState<number>(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [isListing, setIsListing] = useState(false);
  const { toast } = useToast();

  async function listSelected() {
    if (!selected) return;
    
    const qtyToList = Math.min(quantity, selected.quantity);
    
    if (qtyToList <= 0) {
      toast({
        title: "Ошибка",
        description: "Количество должно быть больше 0",
        variant: "destructive",
      });
      return;
    }
    
    setIsListing(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/shop/list-item', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, 
        body: JSON.stringify({ characterId: character.id, itemId: selected.id, quantity: qtyToList, pricePerUnit: price }) 
      });
      const data = await resp.json();
      
      if (data.ok && data.character) {
        onUpdated(data.character);
        setSelected(null);
        setQuantity(1);
        toast({
          title: "✅ Предмет выставлен",
          description: `${selected.name} x${qtyToList} теперь продаётся в вашей лавке за ${price} золота/шт.`,
          duration: 4000,
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
    <div className="space-y-6">
      {/* Статистика лавки */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Товаров выставлено</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{shopInventory.length}</div>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Активные позиции
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая стоимость</CardTitle>
            <Coins className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
              {totalListedValue.toLocaleString()}
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Потенциальная прибыль
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              {shopInventory.length > 0 ? Math.floor(totalListedValue / shopInventory.length) : 0}
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              За позицию
            </p>
          </CardContent>
        </Card>
      </div>

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
            <div className="p-4 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-lg border-2 border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-lg">{selected.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selected.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {selected.rarity || 'common'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Доступно: {selected.quantity} шт.
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelected(null);
                    setQuantity(1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Количество:
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input 
                        id="quantity"
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, Math.min(selected.quantity, Number(e.target.value))))} 
                        className="w-20 text-center"
                        min={1}
                        max={selected.quantity}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.min(selected.quantity, quantity + 1))}
                        disabled={quantity >= selected.quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(selected.quantity)}
                      >
                        Все
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Цена за шт.:
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input 
                        id="price"
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} 
                        className="w-full"
                        min={1}
                      />
                      <Coins className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Общая стоимость:</span>
                    <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      {(price * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={listSelected} 
                  disabled={isListing}
                  className="w-full"
                  size="lg"
                >
                  {isListing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Выставление...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Выставить {quantity > 1 ? `(${quantity} шт.)` : ''}
                    </>
                  )}
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            Выставленные товары
          </CardTitle>
          <CardDescription>
            Товары, доступные для покупки в вашей лавке
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shopInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Нет выставленных товаров</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Выставите предметы из инвентаря, чтобы начать торговлю и зарабатывать золото
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {shopInventory.map((e: any, idx: number) => {
                const item = gameData.items.find((i: any) => i.id === e.itemId);
                const totalValue = e.pricePerUnit * e.quantity;
                
                return (
                  <div 
                    key={idx} 
                    className="group relative p-4 rounded-lg bg-gradient-to-br from-secondary/40 to-secondary/20 border-2 border-secondary hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{item?.name || e.itemId}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              Кол-во: {e.quantity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {item?.type || 'misc'}
                            </Badge>
                            {item?.rarity && item.rarity !== 'common' && (
                              <Badge 
                                variant="default" 
                                className={`text-xs ${
                                  item.rarity === 'legendary' ? 'bg-amber-600' :
                                  item.rarity === 'rare' ? 'bg-purple-600' :
                                  item.rarity === 'uncommon' ? 'bg-blue-600' : ''
                                }`}
                              >
                                {item.rarity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Цена за единицу</p>
                          <p className="text-base font-bold text-amber-600 flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            {e.pricePerUnit}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-xs text-muted-foreground">Общая стоимость</p>
                          <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            {totalValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeItem(e.itemId)}
                        className="w-full mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Снять с продажи
                      </Button>
                    </div>
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


