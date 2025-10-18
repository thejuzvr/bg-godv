"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScoresRow = { actionId: string; name: string; base: number; ruleBoost: number; profile: number; fatigue: number; modifiers: number; total: number };

export default function AISimulatorPage() {
  const { user, loading } = useAuth(true);

  const [name, setName] = useState("Sim Hero");
  const [archetype, setArchetype] = useState("warrior");
  const [location, setLocation] = useState("whiterun");
  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [tired, setTired] = useState(false);
  const [overenc, setOverenc] = useState(false);
  const [mode, setMode] = useState<'single'|'batch'>('single');
  const [ticks, setTicks] = useState(100);
  const [loadingSim, setLoadingSim] = useState(false);

  const [single, setSingle] = useState<{ character: any; logs: { adventure: string[]; combat: string[] }; scores: ScoresRow[] } | null>(null);
  const [batch, setBatch] = useState<any | null>(null);

  const archetypeHelp: Record<string, string> = {
    warrior: 'Воин: старт в Вайтране, базовое оружие и броня. Надежный стиль для проверки боевой логики.',
    thief: 'Вор: старт в Рифтене, отмычки и легкая броня. Больше торговли/скрытности.',
    scholar: 'Ученый: старт в Винтерхолде, книги/заклинания. Упор на магию и изучение.',
    pilgrim: 'Паломник: случайная столица владения, бонус к благосклонности. Проверка божественных механик.',
    mercenary: 'Наемник: старт в Рифтене, золото и снаряжение. Сбалансированный боевой стиль.',
  };

  const modeHelp: Record<'single'|'batch', string> = {
    single: 'Один игровой тик: покажет логи и топ-оценки действий (скоры) в текущем состоянии.',
    batch: 'Серия из N тиков: агрегированные метрики (распределение действий, idle%, циклы) и выборки логов.',
  };

  async function run() {
    if (!user || !user.isAdmin) return;
    setLoadingSim(true);
    setSingle(null); setBatch(null);
    try {
      const getCookie = (key: string) => document.cookie.split('; ').find(p => p.startsWith(key + '='))?.split('=')[1];
      let csrf = getCookie('csrf_token');
      if (!csrf) {
        try { await fetch('/api/ai', { method: 'GET', cache: 'no-store' }); } catch {}
        csrf = getCookie('csrf_token');
      }
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (csrf) headers['x-csrf-token'] = csrf;

      const res = await fetch('/api/ai/simulate', {
        method: 'POST', headers,
        body: JSON.stringify({
          mode,
          ticks,
          character: {
            name, archetype, location,
            hp: { current: hp, max: hp },
            stamina: { current: stamina, max: stamina },
            flags: { tired, overencumbered: overenc },
          }
        })
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (!res.ok) {
        const errText = isJson ? JSON.stringify(await res.json()).slice(0, 200) : (await res.text()).slice(0, 200);
        throw new Error(errText || 'Simulation failed');
      }
      const json = isJson ? await res.json() : {};
      if (mode === 'single') {
        setSingle({ character: json.character, logs: json.logs, scores: json.scores });
      } else {
        setBatch(json);
      }
    } catch (e) {
      console.error(e);
    } finally { setLoadingSim(false); }
  }

  function buildSingleReport() {
    if (!single) return null;
    const c = single.character || {};
    const snapshot = {
      status: c.status,
      location: c.location,
      hp: c?.stats ? `${c.stats.health?.current}/${c.stats.health?.max}` : undefined,
      sp: c?.stats ? `${c.stats.stamina?.current}/${c.stats.stamina?.max}` : undefined,
      timeOfDay: c.timeOfDay,
      weather: c.weather,
    };
    return {
      mode: 'single',
      snapshot,
      scoresTop: single.scores,
      logs: single.logs,
    };
  }

  function buildBatchReport() {
    if (!batch) return null;
    return {
      mode: 'batch',
      ticks: batch.ticks,
      idlePercent: batch.idlePercent,
      distributions: batch.distributions,
      cycles: batch.cycles,
      logsSample: batch.logsSample,
    };
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user || !user.isAdmin) return <div className="p-6">Forbidden</div>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Симулятор</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Имя героя" value={name} onChange={e => setName(e.target.value)} />
            <Select value={archetype} onValueChange={setArchetype}>
              <SelectTrigger>
                <SelectValue placeholder="Архетип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warrior">Воин</SelectItem>
                <SelectItem value="thief">Вор</SelectItem>
                <SelectItem value="scholar">Ученый</SelectItem>
                <SelectItem value="pilgrim">Паломник</SelectItem>
                <SelectItem value="mercenary">Наемник</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Локация (id)" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div />
            <div>{archetypeHelp[archetype] || ''}</div>
            <div>Id локации из базы (например: whiterun, solitude, riften). Определяет точку старта.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input type="number" min={1} max={500} placeholder="Здоровье" value={hp} onChange={e => setHp(Number(e.target.value))} />
            <Input type="number" min={1} max={500} placeholder="Выносливость" value={stamina} onChange={e => setStamina(Number(e.target.value))} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tired} onChange={e => setTired(e.target.checked)} />усталость</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={overenc} onChange={e => setOverenc(e.target.checked)} />перегруз</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>Начальные очки здоровья героя.</div>
            <div>Начальные очки выносливости героя.</div>
            <div>Эмулирует сильную усталость (стамина ≈ 25%). Влияет на выбор отдыха/путешествий.</div>
            <div>Добавляет тяжелые предметы в инвентарь (перегруз). Ограничивает путешествия и ускоряет торговлю.</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={v => setMode(v as 'single'|'batch')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Режим" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Один тик</SelectItem>
                <SelectItem value="batch">Серия тиков</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'batch' && (
              <Input type="number" min={1} max={2000} value={ticks} onChange={e => setTicks(Number(e.target.value))} />
            )}
            <Button onClick={run} disabled={loadingSim}>{loadingSim ? 'Запуск…' : 'Запустить'}</Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div>{modeHelp[mode]}</div>
            {mode === 'batch' && (<div>Количество тиков для симуляции.</div>)}
          </div>
        </CardContent>
      </Card>

      {single && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-0 overflow-auto">
            <div className="flex items-center justify-between px-4 pt-3">
              <div className="text-sm text-muted-foreground">Топ-оценки действий</div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { const r = buildSingleReport(); if (r) copyText(JSON.stringify(r)); }}>Скопировать отчёт</Button>
                <Button variant="secondary" size="sm" onClick={() => { const r = buildSingleReport(); if (r) downloadJson(`ai-single-report-${Date.now()}.json`, r); }}>Скачать .json</Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Fatigue</TableHead>
                  <TableHead>Mods</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {single.scores.map((e) => (
                  <TableRow key={e.actionId}>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.base}</TableCell>
                    <TableCell>{e.ruleBoost}</TableCell>
                    <TableCell>{e.profile.toFixed(2)}</TableCell>
                    <TableCell>{e.fatigue.toFixed(2)}</TableCell>
                    <TableCell>{e.modifiers.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{e.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Card>
            <CardHeader><CardTitle>Логи</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 pb-2">
                <Button variant="secondary" size="sm" onClick={() => copyText((single.logs.adventure.concat(single.logs.combat)).join('\n'))}>Скопировать логи</Button>
              </div>
              <div className="text-sm space-y-1">
                {single.logs.adventure.map((l, i) => (<div key={`a-${i}`}>{l}</div>))}
                {single.logs.combat.map((l, i) => (<div key={`c-${i}`}>{l}</div>))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {batch && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Итоги</CardTitle></CardHeader>
            <CardContent className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>Ticks: {batch.ticks}</div>
              <div>Idle ticks: {batch.idleTicks} ({batch.idlePercent}%)</div>
              <div>Longest run: {batch.cycles?.longestRun ? `${batch.cycles.longestRun.type}×${batch.cycles.longestRun.length}` : '—'}</div>
              <div>Windows: {batch.cycles?.repeatedWindows?.length || 0}</div>
              <div className="col-span-2 md:col-span-4 flex gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => { const r = buildBatchReport(); if (r) copyText(JSON.stringify(r)); }}>Скопировать отчёт</Button>
                <Button variant="secondary" size="sm" onClick={() => { const r = buildBatchReport(); if (r) downloadJson(`ai-batch-report-${Date.now()}.json`, r); }}>Скачать .json</Button>
                <Button variant="secondary" size="sm" onClick={() => { const first = (batch.logsSample?.first || []).join('\n'); const last = (batch.logsSample?.last || []).join('\n'); copyText(`${first}\n---\n${last}`); }}>Скопировать логи</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(batch.distributions?.byCategory || {}).map(([k,v]: any) => (
                    <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(batch.distributions?.byActionName || {}).map(([k,v]: any) => (
                    <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Логи (первые 20)</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {(batch.logsSample?.first || []).map((l: string, i: number) => (<div key={`f-${i}`}>{l}</div>))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Логи (последние 20)</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {(batch.logsSample?.last || []).map((l: string, i: number) => (<div key={`l-${i}`}>{l}</div>))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


