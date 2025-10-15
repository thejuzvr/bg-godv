"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, Undo2, RefreshCw, BarChart3 } from "lucide-react";

import type { Location } from "@/types/location";
import type { CharacterInventoryItem } from "@/types/character";
import type { NPC } from "@/types/npc";
import type { Enemy } from "@/types/enemy";

import {
  listLocations, getLocation, createLocation, updateLocation, deleteLocation,
  listItems, getItem, createItem, updateItem, deleteItem,
  listNpcs, getNpc, createNpc, updateNpc, deleteNpc,
  listEnemies, getEnemy, createEnemy, updateEnemy, deleteEnemy,
  listThoughts, getThought, createThought, updateThought, deleteThought,
  listNpcDialogueLines, getNpcDialogueLine, createNpcDialogueLine, updateNpcDialogueLine, deleteNpcDialogueLine,
} from "./actions";

type TabKey = "locations" | "items" | "npcs" | "enemies" | "thoughts";

function NpcDialogueManager({ npcId }: { npcId: string }) {
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [lines, setLines] = useState<Array<{ id: string; npcId: string; text: string; tags: string[] | null; conditions: any | null; weight: number; cooldownKey?: string | null; locale: string; isEnabled: boolean }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [draft, setDraft] = useState<{ id?: string; npcId: string; text: string; tags: string[] | null; conditions: any | null; weight: number; cooldownKey?: string | null; locale: string; isEnabled: boolean }>({ npcId, text: "", tags: [], conditions: null, weight: 1, cooldownKey: null, locale: 'ru', isEnabled: true });
  const [tagsStr, setTagsStr] = useState<string>("[]");
  const [conditionsStr, setConditionsStr] = useState<string>("{}");

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcId]);

  async function refresh() {
    setIsBusy(true);
    try {
      const res = await listNpcDialogueLines(npcId);
      setLines(res as any);
    } catch (e: any) {
      toast({ title: 'Ошибка загрузки реплик', description: e?.message, variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  }

  function isValidJson(value: string): boolean {
    if (!value || value.trim() === "") return true;
    try { JSON.parse(value); return true; } catch { return false; }
  }
  function beautifyJson(value: string, fallback: string = ""): string {
    try { return JSON.stringify(JSON.parse(value || fallback), null, 2); } catch { return value; }
  }
  function parseJsonOrToast<T>(value: string, fallback: T, field: string): T | null {
    if (!value || value.trim() === "") return fallback;
    try { return JSON.parse(value) as T; } catch (e: any) {
      toast({ title: `Некорректный JSON в поле ${field}`, description: e?.message || 'Ошибка парсинга', variant: 'destructive' });
      return null;
    }
  }

  function startCreate() {
    setEditingId(null);
    setDraft({ npcId, text: "", tags: [], conditions: null, weight: 1, cooldownKey: null, locale: 'ru', isEnabled: true });
    setTagsStr("[]");
    setConditionsStr("{}");
  }

  async function startEdit(id: string) {
    setEditingId(id);
    setIsBusy(true);
    try {
      const val = await getNpcDialogueLine(id);
      if (val) {
        setDraft({
          id: (val as any).id,
          npcId: (val as any).npcId,
          text: (val as any).text,
          tags: (val as any).tags || [],
          conditions: (val as any).conditions || null,
          weight: (val as any).weight || 1,
          cooldownKey: (val as any).cooldownKey || null,
          locale: (val as any).locale || 'ru',
          isEnabled: !!(val as any).isEnabled,
        });
        setTagsStr(JSON.stringify((val as any).tags || [], null, 2));
        setConditionsStr(JSON.stringify((val as any).conditions || {}, null, 2));
      }
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось загрузить реплику', variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  }

  async function save() {
    setIsBusy(true);
    try {
      const tags = parseJsonOrToast<string[]>(tagsStr, [], 'tags');
      if (tags === null) return setIsBusy(false);
      const conditions = parseJsonOrToast<any>(conditionsStr, null as any, 'conditions');
      if (conditions === null && conditionsStr.trim() !== "") return setIsBusy(false);
      const payload = { text: draft.text, tags, conditions, weight: draft.weight, cooldownKey: draft.cooldownKey ?? null, locale: draft.locale, isEnabled: !!draft.isEnabled };
      if (isEditing && draft.id) await updateNpcDialogueLine(draft.id, payload as any);
      else await createNpcDialogueLine({ npcId, ...payload });
      toast({ title: 'Сохранено' });
      await refresh();
      startCreate();
    } catch (e: any) {
      toast({ title: 'Ошибка сохранения', description: e?.message || 'Проверьте введенные данные', variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Удалить реплику?')) return;
    setIsBusy(true);
    try {
      await deleteNpcDialogueLine(id);
      toast({ title: 'Удалено' });
      await refresh();
      startCreate();
    } catch (e: any) {
      toast({ title: 'Ошибка удаления', description: e?.message || 'Не удалось удалить', variant: 'destructive' });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Реплики NPC</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => refresh()} disabled={isBusy}>Обновить</Button>
          <Button size="sm" onClick={() => save()} disabled={isBusy || !draft.text}>Сохранить реплику</Button>
          <Button size="sm" variant="outline" onClick={() => startCreate()} disabled={isBusy}>Создать новую</Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Текст</TableHead>
                <TableHead>Вкл</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="max-w-[140px] truncate" title={l.id}>{l.id}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={l.text}>{l.text}</TableCell>
                  <TableCell>{l.isEnabled ? '✓' : ''}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(l.id)}>Редактировать</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3">
          <Label>Текст</Label>
          <Textarea className="min-h-[100px]" value={draft.text} onChange={(e) => setDraft(prev => ({ ...(prev as any), text: e.target.value }))} />
          <div className="flex items-center justify-between">
            <Label>Теги (JSON [string])</Label>
            <div className="flex gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={() => setTagsStr(beautifyJson(tagsStr, "[]"))}>Форматировать</Button>
              {!isValidJson(tagsStr) && <span className="text-red-500">Некорректный JSON</span>}
            </div>
          </div>
          <Textarea className="font-mono text-xs min-h-[100px]" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder='["greeting"]' />
          <div className="flex items-center justify-between">
            <Label>Условия (JSON)</Label>
            <div className="flex gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={() => setConditionsStr(beautifyJson(conditionsStr, "{}"))}>Форматировать</Button>
              {!isValidJson(conditionsStr) && <span className="text-red-500">Некорректный JSON</span>}
            </div>
          </div>
          <Textarea className="font-mono text-xs min-h-[120px]" value={conditionsStr} onChange={(e) => setConditionsStr(e.target.value)} placeholder='{"locations":["whiterun"]}' />
          <Label>Вес</Label>
          <Input type="number" value={draft.weight ?? 1} onChange={(e) => setDraft(prev => ({ ...(prev as any), weight: Number(e.target.value) }))} />
          <Label>Cooldown Key</Label>
          <Input value={draft.cooldownKey ?? ""} onChange={(e) => setDraft(prev => ({ ...(prev as any), cooldownKey: e.target.value || null }))} />
          <Label>Locale</Label>
          <Input value={draft.locale || 'ru'} onChange={(e) => setDraft(prev => ({ ...(prev as any), locale: e.target.value }))} />
          <div className="flex items-center gap-2">
            <Switch checked={!!draft.isEnabled} onCheckedChange={(v) => setDraft(prev => ({ ...(prev as any), isEnabled: !!v }))} />
            <span>Включено</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DataManagerPage() {
  const { user, loading } = useAuth(true);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("locations");
  const [isBusy, setIsBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Diagnostics state
  const [diag, setDiag] = useState<{ snapshot: any; actions: Array<{ name: string; type: string; weight: number }>; simulation?: { ticks: number; frequencies: Record<string, number> } } | null>(null);
  const [diagTicks, setDiagTicks] = useState<number>(200);

  // Data states
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<CharacterInventoryItem[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [thoughts, setThoughts] = useState<Array<{ id: string; text: string; tags: string[]; conditions: any | null; weight: number; cooldownKey?: string | null; locale: string; isEnabled: boolean }>>([]);

  // Edit buffers
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [locDraft, setLocDraft] = useState<Location | null>(null);
  const [itemDraft, setItemDraft] = useState<CharacterInventoryItem | null>(null);
  const [npcDraft, setNpcDraft] = useState<NPC | null>(null);
  const [enemyDraft, setEnemyDraft] = useState<Enemy | null>(null);
  const [thoughtDraft, setThoughtDraft] = useState<{ id: string; text: string; tags: string[]; conditions: any | null; weight: number; cooldownKey?: string | null; locale: string; isEnabled: boolean } | null>(null);

  const locationTypes = ["city", "town", "ruin", "dungeon", "camp"] as const;
  const itemTypes = ["weapon", "armor", "potion", "misc", "gold", "spell_tome", "key_item", "learning_book", "food"] as const;
  const itemRarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  const equipmentSlots = ["head", "torso", "legs", "hands", "feet", "ring", "amulet", "weapon"] as const;

  const [itemEffectStr, setItemEffectStr] = useState<string>("");
  const [itemLearningEffectStr, setItemLearningEffectStr] = useState<string>("");
  const [npcDialogueStr, setNpcDialogueStr] = useState<string>("");
  const [npcInventoryStr, setNpcInventoryStr] = useState<string>("");
  const [enemyGuaranteedDropStr, setEnemyGuaranteedDropStr] = useState<string>("");
  const [enemyAppliesEffectStr, setEnemyAppliesEffectStr] = useState<string>("");
  const [thoughtTagsStr, setThoughtTagsStr] = useState<string>("[]");
  const [thoughtConditionsStr, setThoughtConditionsStr] = useState<string>("{}");

  const isValidJson = (value: string): boolean => {
    if (!value || value.trim() === "") return true; // empty allowed
    try { JSON.parse(value); return true; } catch { return false; }
  };

  // JSON placeholder examples (avoid inline braces in JSX attributes)
  const itemEffectExample = `{
  "type": "heal",
  "stat": "health",
  "amount": 10
}`;
  const itemLearningEffectExample = `{
  "id": "alchemy_basic",
  "name": "Алхимия"
}`;
  const npcDialogueExample = `[
  "Привет",
  "Пока"
]`;
  const npcInventoryExample = `[
  { "itemId": "iron_sword", "stock": 3 }
]`;
  const enemyGuaranteedDropExample = `[
  { "id": "gold", "quantity": 10 }
]`;
  const enemyAppliesEffectExample = `{
  "type": "debuff",
  "name": "Яд"
}`;
  const beautifyJson = (value: string, fallback: string = ""): string => {
    try { return JSON.stringify(JSON.parse(value || fallback), null, 2); } catch { return value; }
  };

  const resetDrafts = () => {
    setEditingId(null);
    setLocDraft(null);
    setItemDraft(null);
    setNpcDraft(null);
    setEnemyDraft(null);
    setThoughtDraft(null);
  };

  useEffect(() => {
    if (!loading && user && user.isAdmin) {
      void refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  async function refreshAll() {
    setIsBusy(true);
    try {
      const [locs, its, ns, es, ths] = await Promise.all([
        listLocations(),
        listItems(),
        listNpcs(),
        listEnemies(),
        listThoughts(),
      ]);
      setLocations(locs);
      setItems(its);
      setNpcs(ns);
      setEnemies(es);
      setThoughts(ths as any);
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e?.message || "Не удалось загрузить данные", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function fetchDiagnostics(simulate: boolean) {
    try {
      const url = simulate ? `/api/ai/diagnostics?ticks=${Math.max(0, Math.min(1000, diagTicks || 0))}` : `/api/ai/diagnostics`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Diagnostics error');
      setDiag(data);
    } catch (e: any) {
      setDiag(null);
      toast({ title: 'Диагностика не удалась', description: e?.message || 'Ошибка запроса', variant: 'destructive' });
    }
  }

  function getCurrentList() {
    if (activeTab === "locations") return locations;
    if (activeTab === "items") return items;
    if (activeTab === "npcs") return npcs;
    if (activeTab === "enemies") return enemies;
    return thoughts;
  }

  function exportCurrent() {
    try {
      const data = getCurrentList();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'Ошибка экспорта', description: e?.message, variant: 'destructive' });
    }
  }

  async function importJson(text: string) {
    let records: any[];
    try {
      records = JSON.parse(text);
      if (!Array.isArray(records)) throw new Error('Ожидается массив JSON');
    } catch (e: any) {
      toast({ title: 'Некорректный JSON', description: e?.message || 'Не удалось разобрать файл', variant: 'destructive' });
      return;
    }

    setIsBusy(true);
    let success = 0, skipped = 0;
    try {
      for (const rec of records) {
        if (!rec || typeof rec !== 'object' || !rec.id) { skipped++; continue; }
        try {
          if (activeTab === 'locations') {
            const exist = locations.find(l => l.id === rec.id) || await getLocation(rec.id);
            if (exist) await updateLocation(rec.id, { name: rec.name ?? exist.name, type: rec.type ?? exist.type, coords: rec.coords ?? exist.coords, isSafe: rec.isSafe ?? exist.isSafe });
            else await createLocation(rec);
          } else if (activeTab === 'items') {
            const exist = items.find(i => i.id === rec.id) || await getItem(rec.id);
            if (exist) await updateItem(rec.id, { name: rec.name ?? exist.name, weight: rec.weight ?? exist.weight, type: rec.type ?? exist.type, rarity: rec.rarity ?? (exist as any).rarity ?? null, equipmentSlot: rec.equipmentSlot ?? (exist as any).equipmentSlot ?? null, damage: rec.damage ?? (exist as any).damage ?? null, armor: rec.armor ?? (exist as any).armor ?? null, effect: rec.effect ?? (exist as any).effect ?? null, spellId: rec.spellId ?? (exist as any).spellId ?? null, learningEffect: rec.learningEffect ?? (exist as any).learningEffect ?? null });
            else await createItem(rec);
          } else if (activeTab === 'npcs') {
            const exist = npcs.find(n => n.id === rec.id) || await getNpc(rec.id);
            const payload = { name: rec.name ?? exist?.name ?? '', description: rec.description ?? exist?.description ?? '', location: rec.location ?? exist?.location ?? 'whiterun', dialogue: rec.dialogue ?? exist?.dialogue ?? [], inventory: rec.inventory ?? exist?.inventory ?? [], isCompanion: rec.isCompanion ?? exist?.isCompanion ?? false, hireCost: rec.hireCost ?? (exist as any)?.hireCost ?? null, factionId: rec.factionId ?? (exist as any)?.factionId ?? null, companionDetails: rec.companionDetails ?? (exist as any)?.companionDetails ?? null };
            if (exist) await updateNpc(rec.id, payload); else await createNpc({ id: rec.id, ...payload });
          } else if (activeTab === 'enemies') {
            const exist = enemies.find(e => e.id === rec.id) || await getEnemy(rec.id);
            const payload = { name: rec.name ?? exist?.name ?? '', health: rec.health ?? exist?.health ?? 10, damage: rec.damage ?? exist?.damage ?? 2, xp: rec.xp ?? exist?.xp ?? 5, level: rec.level ?? exist?.level ?? 1, minLevel: rec.minLevel ?? (exist as any)?.minLevel ?? null, isUnique: rec.isUnique ?? (exist as any)?.isUnique ?? false, guaranteedDrop: rec.guaranteedDrop ?? (exist as any)?.guaranteedDrop ?? null, appliesEffect: rec.appliesEffect ?? (exist as any)?.appliesEffect ?? null, armor: rec.armor ?? (exist as any)?.armor ?? null };
            if (exist) await updateEnemy(rec.id, payload); else await createEnemy({ id: rec.id, ...payload });
          } else if (activeTab === 'thoughts') {
            const exist = thoughts.find(t => t.id === rec.id) || await getThought(rec.id);
            const payload = {
              text: rec.text ?? exist?.text ?? '',
              tags: rec.tags ?? (exist as any)?.tags ?? [],
              conditions: rec.conditions ?? (exist as any)?.conditions ?? null,
              weight: rec.weight ?? (exist as any)?.weight ?? 1,
              cooldownKey: rec.cooldownKey ?? (exist as any)?.cooldownKey ?? null,
              locale: rec.locale ?? (exist as any)?.locale ?? 'ru',
              isEnabled: rec.isEnabled ?? (exist as any)?.isEnabled ?? true,
            };
            if (exist) await updateThought(rec.id, payload as any); else await createThought({ id: rec.id, ...payload });
          }
          success++;
        } catch {
          skipped++;
        }
      }
      toast({ title: 'Импорт завершен', description: `Успех: ${success}, Пропущено: ${skipped}` });
      await refreshAll();
    } finally {
      setIsBusy(false);
    }
  }

  function triggerImport() {
    importInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importJson(String(reader.result || ''));
      if (importInputRef.current) importInputRef.current.value = "";
    };
    reader.readAsText(file);
  }

  // Utilities to start editing/creating
  function startCreate(entity: TabKey) {
    setEditingId(null);
    if (entity === "locations") {
      setLocDraft({ id: "", name: "", type: "city", coords: { x: 50, y: 50 }, isSafe: true });
    } else if (entity === "items") {
      setItemDraft({ id: "", name: "", weight: 1, quantity: 1, type: "misc" as any });
      setItemEffectStr("");
      setItemLearningEffectStr("");
    } else if (entity === "npcs") {
      setNpcDraft({ id: "", name: "", description: "", location: "whiterun", dialogue: [], inventory: [], isCompanion: false });
      setNpcDialogueStr("[]");
      setNpcInventoryStr("[]");
    } else if (entity === "enemies") {
      setEnemyDraft({ id: "", name: "", health: 10, damage: 2, xp: 5, level: 1 } as Enemy);
      setEnemyGuaranteedDropStr("[]");
      setEnemyAppliesEffectStr("{}");
    } else if (entity === "thoughts") {
      setThoughtDraft({ id: "", text: "", tags: [], conditions: null, weight: 1, cooldownKey: null, locale: "ru", isEnabled: true });
      setThoughtTagsStr("[]");
      setThoughtConditionsStr("{}");
    }
  }

  async function startEdit(entity: TabKey, id: string) {
    setEditingId(id);
    setIsBusy(true);
    try {
      if (entity === "locations") {
        const val = await getLocation(id);
        setLocDraft(val);
      } else if (entity === "items") {
        const val = await getItem(id);
        setItemDraft(val);
        setItemEffectStr(val && (val as any).effect ? JSON.stringify((val as any).effect, null, 2) : "");
        setItemLearningEffectStr(val && (val as any).learningEffect ? JSON.stringify((val as any).learningEffect, null, 2) : "");
      } else if (entity === "npcs") {
        const val = await getNpc(id);
        setNpcDraft(val as NPC);
        setNpcDialogueStr(val && (val as any).dialogue ? JSON.stringify((val as any).dialogue, null, 2) : "[]");
        setNpcInventoryStr(val && (val as any).inventory ? JSON.stringify((val as any).inventory, null, 2) : "[]");
      } else if (entity === "enemies") {
        const val = await getEnemy(id);
        setEnemyDraft(val as Enemy);
        setEnemyGuaranteedDropStr(val && (val as any).guaranteedDrop ? JSON.stringify((val as any).guaranteedDrop, null, 2) : "[]");
        setEnemyAppliesEffectStr(val && (val as any).appliesEffect ? JSON.stringify((val as any).appliesEffect, null, 2) : "{}");
      } else if (entity === "thoughts") {
        const val = await getThought(id);
        if (val) {
          setThoughtDraft({
            id: val.id,
            text: val.text,
            tags: (val as any).tags || [],
            conditions: (val as any).conditions || null,
            weight: (val as any).weight || 1,
            cooldownKey: (val as any).cooldownKey || null,
            locale: (val as any).locale || 'ru',
            isEnabled: !!(val as any).isEnabled,
          });
          setThoughtTagsStr(JSON.stringify((val as any).tags || [], null, 2));
          setThoughtConditionsStr(JSON.stringify((val as any).conditions || {}, null, 2));
        }
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось загрузить запись", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  function parseJsonOrToast<T>(value: string, fallback: T, field: string): T | null {
    if (!value || value.trim() === "") return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (e: any) {
      toast({ title: `Некорректный JSON в поле ${field}`, description: e?.message || "Ошибка парсинга", variant: "destructive" });
      return null;
    }
  }

  async function saveCurrent() {
    setIsBusy(true);
    try {
      if (activeTab === "locations" && locDraft) {
        if (isEditing) await updateLocation(locDraft.id, { name: locDraft.name, type: locDraft.type as any, coords: locDraft.coords, isSafe: !!locDraft.isSafe });
        else await createLocation({ id: locDraft.id, name: locDraft.name, type: locDraft.type as any, coords: locDraft.coords, isSafe: !!locDraft.isSafe });
      }
      if (activeTab === "items" && itemDraft) {
        const effect = parseJsonOrToast<any>(itemEffectStr, null, "effect");
        if (effect === null && itemEffectStr.trim() !== "") return setIsBusy(false);
        const learningEffect = parseJsonOrToast<any>(itemLearningEffectStr, null, "learningEffect");
        if (learningEffect === null && itemLearningEffectStr.trim() !== "") return setIsBusy(false);
        if (isEditing) await updateItem(itemDraft.id, { name: itemDraft.name, weight: itemDraft.weight, type: itemDraft.type as any, rarity: (itemDraft as any).rarity ?? null, equipmentSlot: (itemDraft as any).equipmentSlot ?? null, damage: (itemDraft as any).damage ?? null, armor: (itemDraft as any).armor ?? null, effect: effect, spellId: (itemDraft as any).spellId ?? null, learningEffect: learningEffect });
        else await createItem({ id: itemDraft.id, name: itemDraft.name, weight: itemDraft.weight, type: itemDraft.type as any, rarity: (itemDraft as any).rarity ?? null, equipmentSlot: (itemDraft as any).equipmentSlot ?? null, damage: (itemDraft as any).damage ?? null, armor: (itemDraft as any).armor ?? null, effect: effect, spellId: (itemDraft as any).spellId ?? null, learningEffect: learningEffect });
      }
      if (activeTab === "npcs" && npcDraft) {
        const dialogue = parseJsonOrToast<string[]>(npcDialogueStr, [], "dialogue");
        if (dialogue === null) return setIsBusy(false);
        const inventory = parseJsonOrToast<Array<{ itemId: string; stock: number; priceModifier?: number }>>(npcInventoryStr, [], "inventory");
        if (inventory === null) return setIsBusy(false);
        const payload = { name: npcDraft.name, description: npcDraft.description || "", location: npcDraft.location, dialogue, inventory, isCompanion: !!npcDraft.isCompanion, hireCost: npcDraft.hireCost ?? null, factionId: npcDraft.factionId ?? null, companionDetails: npcDraft.companionDetails ?? null };
        if (isEditing) await updateNpc(npcDraft.id, payload);
        else await createNpc({ id: npcDraft.id, ...payload });
      }
      if (activeTab === "enemies" && enemyDraft) {
        const guaranteedDrop = parseJsonOrToast<Array<{ id: string; quantity: number }>>(enemyGuaranteedDropStr, null as any, "guaranteedDrop");
        if (guaranteedDrop === null && enemyGuaranteedDropStr.trim() !== "") return setIsBusy(false);
        const appliesEffect = parseJsonOrToast<any>(enemyAppliesEffectStr, null as any, "appliesEffect");
        if (appliesEffect === null && enemyAppliesEffectStr.trim() !== "") return setIsBusy(false);
        const payload = { name: enemyDraft.name, health: enemyDraft.health, damage: enemyDraft.damage, xp: enemyDraft.xp, level: enemyDraft.level, minLevel: (enemyDraft as any).minLevel ?? null, isUnique: !!(enemyDraft as any).isUnique, guaranteedDrop: guaranteedDrop, appliesEffect: appliesEffect, armor: (enemyDraft as any).armor ?? null };
        if (isEditing) await updateEnemy(enemyDraft.id, payload);
        else await createEnemy({ id: enemyDraft.id, ...payload });
      }
      if (activeTab === "thoughts" && thoughtDraft) {
        const tags = parseJsonOrToast<string[]>(thoughtTagsStr, [], "tags");
        if (tags === null) return setIsBusy(false);
        const conditions = parseJsonOrToast<any>(thoughtConditionsStr, null as any, "conditions");
        if (conditions === null && thoughtConditionsStr.trim() !== "") return setIsBusy(false);
        const payload = { text: thoughtDraft.text, tags, conditions, weight: thoughtDraft.weight, cooldownKey: thoughtDraft.cooldownKey ?? null, locale: thoughtDraft.locale, isEnabled: !!thoughtDraft.isEnabled };
        if (isEditing) await updateThought(thoughtDraft.id, payload as any);
        else await createThought({ id: thoughtDraft.id, ...payload });
      }
      toast({ title: "Сохранено" });
      resetDrafts();
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e?.message || "Проверьте введенные данные", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  async function removeCurrent(id: string) {
    if (!confirm("Удалить запись?")) return;
    setIsBusy(true);
    try {
      if (activeTab === "locations") await deleteLocation(id);
      if (activeTab === "items") await deleteItem(id);
      if (activeTab === "npcs") await deleteNpc(id);
      if (activeTab === "enemies") await deleteEnemy(id);
      if (activeTab === "thoughts") await deleteThought(id);
      toast({ title: "Удалено" });
      resetDrafts();
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Ошибка удаления", description: e?.message || "Не удалось удалить", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка...</div>;
  }
  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ запрещен</CardTitle>
            <CardDescription>У вас нет прав для доступа к этой странице.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Вернуться на дашборд</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="w-full font-body p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline text-primary">Менеджер данных</h1>
          <p className="text-muted-foreground">Создание, редактирование и удаление сущностей игры.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin">Назад в админку</Link></Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Сущности</CardTitle>
            <CardDescription>Выберите тип данных для управления</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => startCreate(activeTab)} disabled={isBusy}><Plus className="h-4 w-4" />Создать</Button>
            <Button onClick={() => refreshAll()} variant="secondary" disabled={isBusy}><Undo2 className="h-4 w-4" />Обновить</Button>
            <Button onClick={() => saveCurrent()} variant="default" disabled={isBusy || (!locDraft && !itemDraft && !npcDraft && !enemyDraft)}><Save className="h-4 w-4" />Сохранить</Button>
            <Button onClick={triggerImport} variant="outline" disabled={isBusy}>Импорт JSON</Button>
            <Button onClick={exportCurrent} variant="outline" disabled={isBusy}>Экспорт JSON</Button>
            <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" />Диагностика AI</h3>
                <p className="text-sm text-muted-foreground">Текущие веса действий и симуляция тико́в</p>
              </div>
              <div className="flex items-center gap-2">
                <Input className="w-28" type="number" value={diagTicks} onChange={(e) => setDiagTicks(Number(e.target.value))} />
                <Button variant="secondary" onClick={() => fetchDiagnostics(false)}><RefreshCw className="h-4 w-4" />Обновить</Button>
                <Button onClick={() => fetchDiagnostics(true)}>Симулировать</Button>
              </div>
            </div>
            {diag && (
              <div className="mt-3 grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Снапшот</CardTitle>
                    <CardDescription>{diag.snapshot?.name} — {diag.snapshot?.status} @ {diag.snapshot?.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm grid grid-cols-2 gap-2">
                      <div>HP: {diag.snapshot?.hp}</div>
                      <div>MP: {diag.snapshot?.mp}</div>
                      <div>SP: {diag.snapshot?.sp}</div>
                      <div>Настроение: {diag.snapshot?.mood}</div>
                      <div>Время: {diag.snapshot?.timeOfDay}</div>
                      <div>Погода: {diag.snapshot?.weather}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Веса действий</CardTitle>
                    <CardDescription>После variety‑boost</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Действие</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead className="text-right">Вес</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diag.actions?.sort((a,b) => b.weight - a.weight).slice(0, 12).map((a, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{a.name}</TableCell>
                            <TableCell>{a.type}</TableCell>
                            <TableCell className="text-right">{a.weight.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {diag.simulation && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Симуляция</CardTitle>
                      <CardDescription>{diag.simulation.ticks} тиков — частоты по категориям</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Категория</TableHead>
                            <TableHead className="text-right">Количество</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(diag.simulation.frequencies).map(([k,v]) => (
                            <TableRow key={k}>
                              <TableCell>{k}</TableCell>
                              <TableCell className="text-right">{v as any}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TabKey); resetDrafts(); }}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="locations">Локации</TabsTrigger>
              <TabsTrigger value="items">Предметы</TabsTrigger>
              <TabsTrigger value="npcs">NPC</TabsTrigger>
              <TabsTrigger value="enemies">Враги</TabsTrigger>
              <TabsTrigger value="thoughts">Мысли</TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.id}</TableCell>
                        <TableCell>{l.name}</TableCell>
                        <TableCell>{l.type}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit("locations", l.id)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeCurrent(l.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">{isEditing ? "Редактирование локации" : "Новая локация"}</h3>
                <div className="grid gap-3">
                  <Label htmlFor="loc-id">ID</Label>
                  <Input id="loc-id" value={locDraft?.id || ""} onChange={(e) => setLocDraft(prev => ({ ...(prev || { id: "", name: "", type: "city", coords: { x: 50, y: 50 }, isSafe: true }), id: e.target.value }))} disabled={isEditing || isBusy} />
                  <Label htmlFor="loc-name">Название</Label>
                  <Input id="loc-name" value={locDraft?.name || ""} onChange={(e) => setLocDraft(prev => ({ ...(prev || { id: "", name: "", type: "city", coords: { x: 50, y: 50 }, isSafe: true }), name: e.target.value }))} disabled={isBusy} />
                  <Label>Тип</Label>
                  <Select value={(locDraft?.type as any) || "city"} onValueChange={(v) => setLocDraft(prev => ({ ...(prev as any), type: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="loc-x">X</Label>
                      <Input id="loc-x" type="number" value={locDraft?.coords.x ?? 50} onChange={(e) => setLocDraft(prev => ({ ...(prev as Location), coords: { x: Number(e.target.value), y: prev?.coords.y ?? 50 } }))} disabled={isBusy} />
                    </div>
                    <div>
                      <Label htmlFor="loc-y">Y</Label>
                      <Input id="loc-y" type="number" value={locDraft?.coords.y ?? 50} onChange={(e) => setLocDraft(prev => ({ ...(prev as Location), coords: { x: prev?.coords.x ?? 50, y: Number(e.target.value) } }))} disabled={isBusy} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!locDraft?.isSafe} onCheckedChange={(v) => setLocDraft(prev => ({ ...(prev as any), isSafe: !!v }))} />
                    <span>Безопасная зона</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.id}</TableCell>
                        <TableCell>{it.name}</TableCell>
                        <TableCell>{it.type}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit("items", it.id)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeCurrent(it.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">{isEditing ? "Редактирование предмета" : "Новый предмет"}</h3>
                <div className="grid gap-3">
                  <Label htmlFor="item-id">ID</Label>
                  <Input id="item-id" value={itemDraft?.id || ""} onChange={(e) => setItemDraft(prev => ({ ...(prev || { id: "", name: "", weight: 1, quantity: 1, type: "misc" as any }), id: e.target.value }))} disabled={isEditing || isBusy} />
                  <Label htmlFor="item-name">Название</Label>
                  <Input id="item-name" value={itemDraft?.name || ""} onChange={(e) => setItemDraft(prev => ({ ...(prev as any), name: e.target.value }))} disabled={isBusy} />
                  <Label>Тип</Label>
                  <Select value={(itemDraft?.type as any) || undefined} onValueChange={(v) => setItemDraft(prev => ({ ...(prev as any), type: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Тип предмета" /></SelectTrigger>
                    <SelectContent>
                      {itemTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="item-weight">Вес</Label>
                  <Input id="item-weight" type="number" value={itemDraft?.weight ?? 1} onChange={(e) => setItemDraft(prev => ({ ...(prev as any), weight: Number(e.target.value) }))} disabled={isBusy} />
                  <Label>Редкость</Label>
                  <Select value={((itemDraft as any)?.rarity as any) || undefined} onValueChange={(v) => setItemDraft(prev => ({ ...(prev as any), rarity: v }))}>
                    <SelectTrigger><SelectValue placeholder="Редкость" /></SelectTrigger>
                    <SelectContent>
                      {itemRarities.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Label>Слот экипировки</Label>
                  <Select value={((itemDraft as any)?.equipmentSlot as any) || undefined} onValueChange={(v) => setItemDraft(prev => ({ ...(prev as any), equipmentSlot: v }))}>
                    <SelectTrigger><SelectValue placeholder="Слот" /></SelectTrigger>
                    <SelectContent>
                      {equipmentSlots.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="item-damage">Урон</Label>
                  <Input id="item-damage" type="number" value={(itemDraft as any)?.damage ?? ""} onChange={(e) => setItemDraft(prev => ({ ...(prev as any), damage: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isBusy} />
                  <Label htmlFor="item-armor">Броня</Label>
                  <Input id="item-armor" type="number" value={(itemDraft as any)?.armor ?? ""} onChange={(e) => setItemDraft(prev => ({ ...(prev as any), armor: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isBusy} />
                  <Label htmlFor="item-spell">Spell ID</Label>
                  <Input id="item-spell" value={(itemDraft as any)?.spellId ?? ""} onChange={(e) => setItemDraft(prev => ({ ...(prev as any), spellId: e.target.value || null }))} disabled={isBusy} />
                  <div className="flex items-center justify-between">
                    <Label>Effect (JSON)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setItemEffectStr(beautifyJson(itemEffectStr))}>Форматировать</Button>
                      {!isValidJson(itemEffectStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={itemEffectStr} onChange={(e) => setItemEffectStr(e.target.value)} placeholder={itemEffectExample} />
                  <div className="flex items-center justify-between">
                    <Label>Learning Effect (JSON)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setItemLearningEffectStr(beautifyJson(itemLearningEffectStr))}>Форматировать</Button>
                      {!isValidJson(itemLearningEffectStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={itemLearningEffectStr} onChange={(e) => setItemLearningEffectStr(e.target.value)} placeholder={itemLearningEffectExample} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="npcs" className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Локация</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {npcs.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell>{n.id}</TableCell>
                        <TableCell>{n.name}</TableCell>
                        <TableCell>{n.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit("npcs", n.id)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeCurrent(n.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">{isEditing ? "Редактирование NPC" : "Новый NPC"}</h3>
                <div className="grid gap-3">
                  <Label htmlFor="npc-id">ID</Label>
                  <Input id="npc-id" value={npcDraft?.id || ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev || { id: "", name: "", description: "", location: "whiterun", dialogue: [] }), id: e.target.value }))} disabled={isEditing || isBusy} />
                  <Label htmlFor="npc-name">Имя</Label>
                  <Input id="npc-name" value={npcDraft?.name || ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), name: e.target.value }))} disabled={isBusy} />
                  <Label htmlFor="npc-location">Локация</Label>
                  <Input id="npc-location" value={npcDraft?.location || ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), location: e.target.value }))} disabled={isBusy} />
                  <Label htmlFor="npc-desc">Описание</Label>
                  <Textarea id="npc-desc" className="min-h-[100px]" value={npcDraft?.description || ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), description: e.target.value }))} disabled={isBusy} />
                  <div className="flex items-center justify-between">
                    <Label>Диалоги (JSON массив строк)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setNpcDialogueStr(beautifyJson(npcDialogueStr, "[]"))}>Форматировать</Button>
                      {!isValidJson(npcDialogueStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={npcDialogueStr} onChange={(e) => setNpcDialogueStr(e.target.value)} placeholder={npcDialogueExample} />
                  <div className="flex items-center justify-between">
                    <Label>Инвентарь (JSON [ {"{"}itemId, stock, priceModifier?{"}"} ])</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setNpcInventoryStr(beautifyJson(npcInventoryStr, "[]"))}>Форматировать</Button>
                      {!isValidJson(npcInventoryStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={npcInventoryStr} onChange={(e) => setNpcInventoryStr(e.target.value)} placeholder={npcInventoryExample} />
                  <div className="flex items-center gap-2">
                    <Switch checked={!!npcDraft?.isCompanion} onCheckedChange={(v) => setNpcDraft(prev => ({ ...(prev as any), isCompanion: !!v }))} />
                    <span>Спутник</span>
                  </div>
                  <Label htmlFor="npc-hire">Стоимость найма</Label>
                  <Input id="npc-hire" type="number" value={(npcDraft as any)?.hireCost ?? ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), hireCost: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isBusy} />
                  <Label htmlFor="npc-faction">ID фракции</Label>
                  <Input id="npc-faction" value={(npcDraft as any)?.factionId ?? ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), factionId: e.target.value || null }))} disabled={isBusy} />
                  <Label htmlFor="npc-combat">Combat Style</Label>
                  <Input id="npc-combat" value={(npcDraft as any)?.companionDetails?.combatStyle ?? ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), companionDetails: { ...(prev as any)?.companionDetails, combatStyle: e.target.value } }))} disabled={isBusy} />
                  <Label htmlFor="npc-skill">Primary Skill</Label>
                  <Input id="npc-skill" value={(npcDraft as any)?.companionDetails?.primarySkill ?? ""} onChange={(e) => setNpcDraft(prev => ({ ...(prev as any), companionDetails: { ...(prev as any)?.companionDetails, primarySkill: e.target.value } }))} disabled={isBusy} />
                </div>
                {/* NPC Dialogue Lines sub-table */}
                {npcDraft && (
                  <NpcDialogueManager npcId={npcDraft.id} />
                )}
              </div>
            </TabsContent>
            <TabsContent value="thoughts" className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Текст</TableHead>
                      <TableHead>Вкл</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thoughts.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.id}</TableCell>
                        <TableCell className="max-w-[360px] truncate" title={t.text}>{t.text}</TableCell>
                        <TableCell>{t.isEnabled ? '✓' : ''}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit("thoughts", t.id)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeCurrent(t.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">{isEditing ? "Редактирование мысли" : "Новая мысль"}</h3>
                <div className="grid gap-3">
                  <Label htmlFor="th-id">ID</Label>
                  <Input id="th-id" value={thoughtDraft?.id || ""} onChange={(e) => setThoughtDraft(prev => ({ ...(prev || { id: "", text: "", tags: [], conditions: null, weight: 1, cooldownKey: null, locale: 'ru', isEnabled: true }), id: e.target.value }))} disabled={isEditing || isBusy} />
                  <Label htmlFor="th-text">Текст</Label>
                  <Textarea id="th-text" className="min-h-[100px]" value={thoughtDraft?.text || ""} onChange={(e) => setThoughtDraft(prev => ({ ...(prev as any), text: e.target.value }))} disabled={isBusy} />
                  <div className="flex items-center justify-between">
                    <Label>Теги (JSON [string])</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setThoughtTagsStr(beautifyJson(thoughtTagsStr, "[]"))}>Форматировать</Button>
                      {!isValidJson(thoughtTagsStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={thoughtTagsStr} onChange={(e) => setThoughtTagsStr(e.target.value)} placeholder={`["meme","lore"]`} />
                  <div className="flex items-center justify-between">
                    <Label>Условия (JSON)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setThoughtConditionsStr(beautifyJson(thoughtConditionsStr, "{}"))}>Форматировать</Button>
                      {!isValidJson(thoughtConditionsStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={thoughtConditionsStr} onChange={(e) => setThoughtConditionsStr(e.target.value)} placeholder={`{"status":["idle"],"weather":["Clear"],"moodMin":40}`} />
                  <Label htmlFor="th-weight">Вес</Label>
                  <Input id="th-weight" type="number" value={thoughtDraft?.weight ?? 1} onChange={(e) => setThoughtDraft(prev => ({ ...(prev as any), weight: Number(e.target.value) }))} disabled={isBusy} />
                  <Label htmlFor="th-cooldown">Cooldown Key</Label>
                  <Input id="th-cooldown" value={thoughtDraft?.cooldownKey ?? ""} onChange={(e) => setThoughtDraft(prev => ({ ...(prev as any), cooldownKey: e.target.value || null }))} disabled={isBusy} />
                  <Label htmlFor="th-locale">Locale</Label>
                  <Input id="th-locale" value={thoughtDraft?.locale || "ru"} onChange={(e) => setThoughtDraft(prev => ({ ...(prev as any), locale: e.target.value }))} disabled={isBusy} />
                  <div className="flex items-center gap-2">
                    <Switch checked={!!thoughtDraft?.isEnabled} onCheckedChange={(v) => setThoughtDraft(prev => ({ ...(prev as any), isEnabled: !!v }))} />
                    <span>Включено</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enemies" className="grid lg:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enemies.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.id}</TableCell>
                        <TableCell>{e.name}</TableCell>
                        <TableCell>{e.level}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit("enemies", e.id)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeCurrent(e.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">{isEditing ? "Редактирование врага" : "Новый враг"}</h3>
                <div className="grid gap-3">
                  <Label htmlFor="enemy-id">ID</Label>
                  <Input id="enemy-id" value={enemyDraft?.id || ""} onChange={(e) => setEnemyDraft(prev => ({ ...(prev || { id: "", name: "", health: 10, damage: 2, xp: 5, level: 1 } as any), id: e.target.value }))} disabled={isEditing || isBusy} />
                  <Label htmlFor="enemy-name">Имя</Label>
                  <Input id="enemy-name" value={enemyDraft?.name || ""} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), name: e.target.value }))} disabled={isBusy} />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="enemy-hp">HP</Label>
                      <Input id="enemy-hp" type="number" value={enemyDraft?.health ?? 10} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), health: Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                    <div>
                      <Label htmlFor="enemy-dmg">DMG</Label>
                      <Input id="enemy-dmg" type="number" value={enemyDraft?.damage ?? 2} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), damage: Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                    <div>
                      <Label htmlFor="enemy-xp">XP</Label>
                      <Input id="enemy-xp" type="number" value={enemyDraft?.xp ?? 5} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), xp: Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="enemy-level">Уровень</Label>
                      <Input id="enemy-level" type="number" value={enemyDraft?.level ?? 1} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), level: Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                    <div>
                      <Label htmlFor="enemy-minlevel">Мин.уровень</Label>
                      <Input id="enemy-minlevel" type="number" value={(enemyDraft as any)?.minLevel ?? ""} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), minLevel: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                    <div>
                      <Label htmlFor="enemy-armor">Броня</Label>
                      <Input id="enemy-armor" type="number" value={(enemyDraft as any)?.armor ?? ""} onChange={(e) => setEnemyDraft(prev => ({ ...(prev as any), armor: e.target.value === "" ? null : Number(e.target.value) }))} disabled={isBusy} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!(enemyDraft as any)?.isUnique} onCheckedChange={(v) => setEnemyDraft(prev => ({ ...(prev as any), isUnique: !!v }))} />
                    <span>Уникальный</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Гарантированный дроп (JSON массив)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setEnemyGuaranteedDropStr(beautifyJson(enemyGuaranteedDropStr, "[]"))}>Форматировать</Button>
                      {!isValidJson(enemyGuaranteedDropStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={enemyGuaranteedDropStr} onChange={(e) => setEnemyGuaranteedDropStr(e.target.value)} placeholder={enemyGuaranteedDropExample} />
                  <div className="flex items-center justify-between">
                    <Label>Накладываемый эффект (JSON)</Label>
                    <div className="flex gap-2 text-xs">
                      <Button variant="ghost" size="sm" onClick={() => setEnemyAppliesEffectStr(beautifyJson(enemyAppliesEffectStr, "{}"))}>Форматировать</Button>
                      {!isValidJson(enemyAppliesEffectStr) && <span className="text-red-500">Некорректный JSON</span>}
                    </div>
                  </div>
                  <Textarea className="font-mono text-xs min-h-[120px]" value={enemyAppliesEffectStr} onChange={(e) => setEnemyAppliesEffectStr(e.target.value)} placeholder={enemyAppliesEffectExample} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isBusy && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-background border rounded-md px-4 py-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Обработка...</span>
          </div>
        </div>
      )}
    </main>
  );
}


