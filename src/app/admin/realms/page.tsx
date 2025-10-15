'use client';

import { useEffect, useState } from 'react';
import { listRealms, createRealm, deleteRealm, updateRealm } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RealmsPage() {
  const [rows, setRows] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');

  async function refresh() {
    const data = await listRealms();
    setRows(data as any);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!id || !name) return;
    await createRealm(id, name);
    setId(''); setName('');
    await refresh();
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Реалмы</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">ID</label>
          <Input value={id} onChange={e => setId(e.target.value)} placeholder="global-eu-1" />
        </div>
        <div>
          <label className="block text-sm">Название</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Европа-1" />
        </div>
        <Button onClick={onCreate}>Создать</Button>
      </div>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between border rounded p-2">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.id} · {r.status}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={async () => { await updateRealm(r.id, { status: r.status === 'active' ? 'disabled' : 'active' }); await refresh(); }}>
                {r.status === 'active' ? 'Отключить' : 'Включить'}
              </Button>
              <Button variant="destructive" onClick={async () => { await deleteRealm(r.id); await refresh(); }}>Удалить</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
