"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character } from "@/types/character";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GatheringPage() {
  const { user } = useAuth(true);
  const { toast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const char = await fetchCharacter(user.userId);
      setCharacter(char);
      setLoading(false);
    })();
  }, [user]);

  async function gather() {
    if (!character) return;
    setBusy(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/gathering/start', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id }) });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Не удалось добыть ресурс');
      setCharacter(data.character);
      toast({ title: 'Добыча завершена', description: data.log });
    } catch (e: any) {
      toast({ title: 'Ошибка добычи', description: e?.message || 'Попробуйте позже' });
    } finally {
      setBusy(false);
    }
  }

  async function prioritizeGathering(durationMs: number = 5 * 60 * 1000) {
    if (!character) return;
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      await fetch('/api/ai/priority', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, actionType: 'gather_resources', priorityBoost: 3, durationMs }) });
    } catch {}
  }

  if (loading || !character) return <div className="p-6">Загрузка...</div>;

  const canGatherHere = character.location.endsWith('_outskirts');

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-headline">Добыча ресурсов</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Местность: {character.location}</CardTitle>
          <CardDescription>Ищите жилы руды на окраинах городов. Кнопка "Отправить героя" повышает приоритет добычи на несколько минут.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={gather} disabled={!canGatherHere || busy || character.status === 'in-combat'}>
              {busy ? 'Добыча...' : 'Добыть руду'}
            </Button>
            <Button variant="secondary" onClick={() => prioritizeGathering()} disabled={!canGatherHere || character.status === 'in-combat'}>
              Отправить героя
            </Button>
          </div>
          {!canGatherHere && <p className="text-sm text-muted-foreground">Добыча доступна на окраинах городов.</p>}
        </CardContent>
      </Card>
    </div>
  );
}


