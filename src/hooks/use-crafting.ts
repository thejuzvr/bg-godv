"use client";

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type Discipline = 'alchemy' | 'smithing' | 'enchanting' | 'cooking' | 'tanning' | 'smelting';

export function useCrafting(userId: string | null | undefined) {
  const { toast } = useToast();
  const [discipline, setDiscipline] = useState<Discipline>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('craft:last');
      if (saved) return saved as Discipline;
    }
    return 'alchemy';
  });
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [inventory, setInventory] = useState<{ list: Array<{ id: string; name: string; quantity: number }>; byId: Record<string, { id: string; name: string; quantity: number }>; craftingPoints?: number; craftingLevel?: number; craftingXp?: number }>({ list: [], byId: {}, craftingPoints: 0, craftingLevel: 1, craftingXp: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('craft:last', discipline);
  }, [discipline]);

  async function fetchRecipes(d?: Discipline) {
    setLoading(true);
    try {
      const resp = await fetch(`/api/crafting/recipes?discipline=${encodeURIComponent(d || discipline)}${userId ? `&characterId=${encodeURIComponent(userId)}` : ''}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Failed to load recipes');
      setRecipes(data.recipes || []);
    } catch (e: any) {
      toast({ title: 'Ошибка загрузки рецептов', description: e?.message || 'Попробуйте позже' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRecipes().catch(() => {}); }, [discipline]);

  async function fetchInventory() {
    if (!userId) return;
    try {
      const resp = await fetch(`/api/crafting/inventory?characterId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const data = await resp.json();
      if (!data.success) return;
      setInventory({ list: data.list || [], byId: data.byId || {}, craftingPoints: data.craftingPoints || 0, craftingLevel: data.craftingLevel || 1, craftingXp: data.craftingXp || 0 });
    } catch {}
  }

  useEffect(() => { fetchInventory().catch(() => {}); }, [userId]);

  async function craft(characterId: string, recipeId: string) {
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/crafting/perform', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId, recipeId }) });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Не удалось скрафтить');
      toast({ title: 'Готово', description: data.log || 'Предмет создан' });
      return data;
    } catch (e: any) {
      toast({ title: 'Ошибка крафта', description: e?.message || 'Попробуйте позже' });
      throw e;
    }
  }

  const filtered = useMemo(() => {
    if (!query) return recipes;
    const q = query.toLowerCase();
    return recipes.filter((r) => String(r.name || '').toLowerCase().includes(q));
  }, [recipes, query]);

  return { discipline, setDiscipline, recipes: filtered, loading, query, setQuery, fetchRecipes, craft, inventory };
}


