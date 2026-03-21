"use client";

export function MaterialsPanel(props: { items: Array<{ id: string; name: string; quantity: number }>, relevantIds?: Set<string> }) {
  const list = props.relevantIds && props.relevantIds.size > 0
    ? props.items.filter(i => props.relevantIds!.has(i.id))
    : props.items;
  if (!list || list.length === 0) return null;
  return (
    <div className="p-3 border rounded bg-card/40 font-body">
      <div className="text-sm font-medium mb-2 font-headline">Материалы в наличии</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
        {list.map(it => (
          <div key={it.id} className="flex items-center justify-between border rounded px-2 py-1 bg-background">
            <span className="truncate" title={it.name}>{it.name}</span>
            <span className="font-mono ml-2 font-headline">×{it.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


