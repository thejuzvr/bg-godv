"use client";

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RecipeCard } from './RecipeCard';

export function RecipeList(props: { recipes: any[]; loading?: boolean; query: string; onQuery: (q: string) => void; onCraft: (id: string) => void; disabledIds?: Set<string>; inventoryById?: Record<string, { id: string; name: string; quantity: number }> }) {
  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Поиск рецептов..." value={props.query} onChange={(e) => props.onQuery(e.target.value)} />
      {props.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : props.recipes.length === 0 ? (
        <div className="text-sm text-muted-foreground">Рецептов не найдено.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {props.recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} onCraft={() => props.onCraft(r.id)} disabled={props.disabledIds?.has(r.id)} inventoryById={props.inventoryById} />
          ))}
        </div>
      )}
    </div>
  );
}


