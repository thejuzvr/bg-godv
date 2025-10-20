"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character } from "@/types/character";
import { fetchGameData } from "@/services/gameDataService";
import { ShopManagement } from "@/components/dashboard/shop-management";

export default function TradePage() {
  const { user } = useAuth(true);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const char = await fetchCharacter(user.userId);
      setCharacter(char);
      const g = await fetchGameData();
      setGameData(g);
      setLoading(false);
    })();
  }, [user]);

  if (loading || !character || !gameData) return <div className="p-6">Загрузка...</div>;

  const hasShop = Boolean(character.preferences?.playerShop);

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Торговля</CardTitle>
          <CardDescription>Покупайте и продавайте предметы у торговцев, на глобальном рынке и в собственной лавке.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="merchants">
            <TabsList>
              <TabsTrigger value="merchants">Торговцы</TabsTrigger>
              <TabsTrigger value="market">Глобальный рынок</TabsTrigger>
              <TabsTrigger value="shop">Моя лавка</TabsTrigger>
            </TabsList>

            <TabsContent value="merchants" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                {gameData.npcs.filter((n: any) => Array.isArray(n.inventory) && n.location === character.location).map((npc: any) => (
                  <Card key={npc.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{npc.name}</CardTitle>
                      <CardDescription>{npc.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(npc.inventory || []).map((row: any, idx: number) => {
                        const base = gameData.items.find((i: any) => i.id === row.itemId);
                        const name = base?.name || row.itemId;
                        const price = Math.floor((base?.baseValue || 10) * (row.priceModifier || 1));
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{name}</span>
                            <span className="text-muted-foreground">{price} золота</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="market" className="mt-4">
              <div className="space-y-2">
                {(gameData.market || []).map((row: any, idx: number) => {
                  const base = gameData.items.find((i: any) => i.id === row.itemId);
                  const name = base?.name || row.itemId;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-muted-foreground">Цена: {row.price}</span>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="shop" className="mt-4">
              {!hasShop ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">У вас пока нет лавки. Откройте свою торговую лавку, чтобы продавать предметы другим героям.</p>
                  <Button onClick={async () => {
                    const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
                    const resp = await fetch('/api/shop/purchase', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, name: `${character.name} — Лавка` }) });
                    const data = await resp.json();
                    if (data.ok && data.character) setCharacter(data.character);
                  }}>Купить лавку (500 золота)</Button>
                </div>
              ) : (
                <ShopManagement character={character} gameData={gameData} onUpdated={setCharacter} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


