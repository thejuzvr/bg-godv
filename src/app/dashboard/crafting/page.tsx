"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DisciplineTabs } from '@/components/crafting/DisciplineTabs';
import { useCrafting } from '@/hooks/use-crafting';
import { RecipeList } from '@/components/crafting/RecipeList';
import { MaterialsPanel } from '@/components/crafting/MaterialsPanel';
import { Separator } from '@/components/ui/separator';

export default function CraftingPage() {
  const { user, loading: authLoading } = useAuth(true);
  const { discipline, setDiscipline, recipes, loading, query, setQuery, craft, inventory } = useCrafting(user?.userId);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  async function onCraft(id: string) {
    if (!user?.userId) return;
    setBusyIds(prev => new Set(prev).add(id));
    try {
      await craft(user.userId, id);
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  if (authLoading) return null;
  return (
    <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Крафт</h1>
        <p className="text-sm text-muted-foreground">Создавайте зелья, снаряжение и еду из имеющихся материалов.</p>
      </div>
      <DisciplineTabs value={discipline} onChange={setDiscipline} />
      <Separator />
      <MaterialsPanel items={inventory.list} relevantIds={new Set(recipes.flatMap(r => (r.inputs||[]).map((i:any)=>i.id)))} />
      <RecipeList recipes={recipes} loading={loading} query={query} onQuery={setQuery} onCraft={onCraft} disabledIds={busyIds} inventoryById={inventory.byId} />
    </div>
  );
}


