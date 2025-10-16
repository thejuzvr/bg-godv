"use client";

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Entry = {
  actionId: string;
  name: string;
  base: number;
  ruleBoost: number;
  profile: number;
  fatigue: number;
  modifiers: number;
  total: number;
};

export default function AIInspectPage() {
  const [characterId, setCharacterId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [profileCode, setProfileCode] = useState<string>("");
  const [profiles] = useState<{ id: string; code: string; name: string }[]>([
    { id: 'prof-warrior', code: 'warrior', name: 'Warrior' },
    { id: 'prof-mage', code: 'mage', name: 'Mage' },
    { id: 'prof-thief', code: 'thief', name: 'Thief' },
  ]);
  const [mods, setMods] = useState<any[]>([]);
  const [newMod, setNewMod] = useState({ code: 'luck', label: 'Luck', multiplier: 0.2, ttlMs: 60_000 });

  async function fetchData() {
    if (!characterId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/inspect?characterId=${encodeURIComponent(characterId)}&top=12`, { cache: 'no-store' });
      const data = await res.json();
      setEntries(data.entries || []);
      const prof = await fetch(`/api/ai/profile?characterId=${encodeURIComponent(characterId)}`, { cache: 'no-store' }).then(r => r.json());
      setProfileCode(prof.code || '');
      const m = await fetch(`/api/ai/modifiers?characterId=${encodeURIComponent(characterId)}`, { cache: 'no-store' }).then(r => r.json());
      setMods(m.modifiers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, [autoRefresh, characterId]);

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input placeholder="Character ID" value={characterId} onChange={e => setCharacterId(e.target.value)} />
          <Button onClick={fetchData} disabled={!characterId || loading}>Load</Button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto-refresh
          </label>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={profileCode} onChange={e => setProfileCode(e.target.value)}>
            <option value="">— Profile —</option>
            {profiles.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
          </select>
          <Button disabled={!characterId || !profileCode} onClick={async () => {
            const selected = profiles.find(p => p.code === profileCode);
            if (!selected) return;
            await fetch(`/api/ai/profile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ characterId, profileId: selected.id }) });
            await fetchData();
          }}>Save Profile</Button>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Input placeholder="code" value={newMod.code} onChange={e => setNewMod({ ...newMod, code: e.target.value })} />
            <Input placeholder="label" value={newMod.label} onChange={e => setNewMod({ ...newMod, label: e.target.value })} />
            <Input placeholder="multiplier" value={String(newMod.multiplier)} onChange={e => setNewMod({ ...newMod, multiplier: Number(e.target.value) })} />
            <Input placeholder="ttlMs" value={String(newMod.ttlMs)} onChange={e => setNewMod({ ...newMod, ttlMs: Number(e.target.value) })} />
            <Button disabled={!characterId} onClick={async () => {
              await fetch(`/api/ai/modifiers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ characterId, ...newMod }) });
              await fetchData();
            }}>Add/Upsert Mod</Button>
          </div>
          <div>
            <div className="text-sm font-medium">Active Modifiers</div>
            <div className="flex flex-col gap-1">
              {mods.map((m) => (
                <div key={`${m.code}:${m.createdAt}`} className="flex items-center gap-2 text-sm">
                  <span className="min-w-24">{m.code}</span>
                  <span>{m.label}</span>
                  <span>{m.multiplier}</span>
                  <Button variant="secondary" onClick={async () => {
                    await fetch(`/api/ai/modifiers?characterId=${encodeURIComponent(characterId)}&code=${encodeURIComponent(m.code)}`, { method: 'DELETE' });
                    await fetchData();
                  }}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-auto">
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
            {entries.map(e => (
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
    </div>
  );
}


