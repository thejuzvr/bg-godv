"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Discipline } from '@/hooks/use-crafting';

const DISCIPLINES: { key: Discipline; label: string }[] = [
  { key: 'alchemy', label: 'Алхимия' },
  { key: 'smithing', label: 'Кузнечное' },
  { key: 'enchanting', label: 'Зачарование' },
  { key: 'cooking', label: 'Кулинария' },
  { key: 'tanning', label: 'Дубление' },
  { key: 'smelting', label: 'Плавильня' },
];

export function DisciplineTabs(props: { value: Discipline; onChange: (d: Discipline) => void }) {
  return (
    <Tabs value={props.value} onValueChange={(v) => props.onChange(v as Discipline)} className="font-body">
      <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
        {DISCIPLINES.map((d) => (
          <TabsTrigger key={d.key} value={d.key} className="text-xs sm:text-sm truncate font-headline">
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}


