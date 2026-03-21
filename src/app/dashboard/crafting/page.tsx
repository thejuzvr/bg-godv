"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DisciplineTabs } from '@/components/crafting/DisciplineTabs';
import { useCrafting } from '@/hooks/use-crafting';
import { RecipeList } from '@/components/crafting/RecipeList';
import { MaterialsPanel } from '@/components/crafting/MaterialsPanel';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

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
    <div className="p-3 max-w-5xl mx-auto flex flex-col gap-2 font-body">
      <div className="flex items-end justify-between gap-4 font-body">
        <div className="font-body">
          <h1 className="text-xl font-semibold font-headline">Крафт</h1>
          <p className="text-sm text-muted-foreground font-body">Создавайте зелья, снаряжение и еду из имеющихся материалов.</p>
        </div>
        <div className="text-sm flex items-center gap-3 font-body">
          <span className="font-body">Ур. крафта: <span className="font-semibold font-body">{(inventory as Record<string, string | number>).craftingLevel ?? '-'}</span></span>
          <span className="font-body">Очки крафта: <span className="font-semibold font-body">{inventory.craftingPoints ?? 0}</span></span>
        </div>
      </div>
      {/* Crafting XP progress */}
      <div className="flex items-center gap-3 font-body">
        <Progress className="h-3" value={Math.min(100, ((inventory.craftingXp || 0) % 100))} />
        <span className="text-xs text-muted-foreground whitespace-nowrap font-body">{(inventory.craftingXp || 0) % 100} / 100 XP</span>
      </div>
      <DisciplineTabs value={discipline} onChange={setDiscipline} />
      <Separator />
      <MaterialsPanel items={inventory.list} relevantIds={new Set(recipes.flatMap(r => (r.inputs||[]).map((i: { id: string })=>i.id)))} />
      <RecipeList recipes={recipes} loading={loading} query={query} onQuery={setQuery} onCraft={onCraft} disabledIds={busyIds} inventoryById={inventory.byId} characterId={user?.userId || undefined} />
    </div>
  );
}


