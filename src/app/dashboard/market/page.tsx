"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import type { Character } from '@/types/character';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Row = { itemId: string; price: number; supply: number; demand: number };

export default function MarketPage() {
  const { user } = useAuth(true);
  const { toast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [market, setMarket] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const char = await fetchCharacter(user.userId);
      setCharacter(char);
      const resp = await fetch('/api/market/list');
      const data = await resp.json();
      setMarket(data.market || []);
      setLoading(false);
    })();
  }, [user]);

  async function trade(side: 'buy'|'sell', itemId: string) {
    if (!character) return;
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/market/trade', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, itemId, qty, side }) });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Сделка не удалась');
      setCharacter(data.character);
      toast({ title: side === 'buy' ? 'Покупка выполнена' : 'Продажа выполнена' });
      // refresh market
      const r2 = await fetch('/api/market/list');
      const d2 = await r2.json();
      setMarket(d2.market || []);
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Попробуйте позже' });
    }
  }

  const gold = useMemo(() => (character?.inventory.find(i => i.id === 'gold')?.quantity || 0), [character]);

  if (loading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-headline">Рынок (глобальный)</h1>
      <div className="flex items-center gap-3">
        <span>Кол-во:</span>
        <Input type="number" className="w-24" value={qty} min={1} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} />
        <span className="ml-auto">Золото: {gold}</span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {market.map((row) => (
          <Card key={row.itemId}>
            <CardHeader>
              <CardTitle className="font-headline">{row.itemId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Цена: {row.price}</div>
              <div>Предложение: {row.supply} • Спрос: {row.demand}</div>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => trade('buy', row.itemId)}>Купить</Button>
                <Button variant="secondary" onClick={() => trade('sell', row.itemId)}>Продать</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


