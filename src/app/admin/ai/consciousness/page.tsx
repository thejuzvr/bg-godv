"use client";

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type WeightRow = { id: string; name: string; type: string; base: number; personality: number; goal: number; final: number };

export default function ConsciousnessPage() {
  const [characterId, setCharacterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function load() {
    if (!characterId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/consciousness?characterId=${encodeURIComponent(characterId)}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [autoRefresh, characterId]);

  const personality = data?.personality;
  const weights: WeightRow[] = data?.weights || [];
  const goal = data?.currentGoal;

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Character ID" value={characterId} onChange={e => setCharacterId(e.target.value)} />
          <Button onClick={load} disabled={!characterId || loading}>{loading ? 'Loading…' : 'Load'}</Button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto-refresh
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Current Goal</div>
          {goal ? (
            <div className="text-sm">
              <div><span className="font-medium">Type:</span> {goal.type}</div>
              <div><span className="font-medium">Description:</span> {goal.description}</div>
              <div><span className="font-medium">Priority:</span> {goal.priority}</div>
            </div>
          ) : <div className="text-sm text-muted-foreground">No goal</div>}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold">Personality</div>
          {personality ? (
            <div className="text-sm grid grid-cols-2 gap-1">
              <div>Archetype: {personality.archetype}</div>
              <div>aggression: {personality.traits.aggression}</div>
              <div>greed: {personality.traits.greed}</div>
              <div>curiosity: {personality.traits.curiosity}</div>
              <div>piety: {personality.traits.piety}</div>
              <div>sociability: {personality.traits.sociability}</div>
            </div>
          ) : <div className="text-sm text-muted-foreground">—</div>}
        </Card>
      </div>

      <Card className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Personality</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weights.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.type}</TableCell>
                <TableCell>{w.base.toFixed(2)}</TableCell>
                <TableCell>{w.personality.toFixed(2)}</TableCell>
                <TableCell>{w.goal.toFixed(2)}</TableCell>
                <TableCell className="font-medium">{w.final.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


