"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character } from "@/types/character";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pickaxe, MapPin, Zap, Package, Loader2, TrendingUp, Clock } from "lucide-react";

// Типы ресурсов которые можно добыть
const resourceTypes = [
  // Руды
  { id: 'ore_iron', name: 'Железная руда', icon: '⛏️', description: 'Основной материал для кузнечного дела', category: 'Руды' },
  { id: 'ore_silver', name: 'Серебряная руда', icon: '✨', description: 'Ценный металл для ювелирных изделий', category: 'Руды' },
  { id: 'ore_gold', name: 'Золотая руда', icon: '💰', description: 'Редкий и ценный металл', category: 'Руды' },
  { id: 'ore_corundum', name: 'Корунд', icon: '💎', description: 'Прочный минерал для крафта', category: 'Руды' },
  { id: 'ore_quicksilver', name: 'Ртутная руда', icon: '🌙', description: 'Редкая руда для эльфийского оружия', category: 'Руды' },
  { id: 'ore_moonstone', name: 'Лунный камень', icon: '🌕', description: 'Магический кристалл', category: 'Руды' },
  { id: 'ore_malachite', name: 'Малахит', icon: '🟢', description: 'Зеленый минерал для стеклянного оружия', category: 'Руды' },
  { id: 'ore_orichalcum', name: 'Орихалк', icon: '🟡', description: 'Орочья руда', category: 'Руды' },
  { id: 'ore_ebony', name: 'Эбонитовая руда', icon: '⚫', description: 'Легендарная темная руда', category: 'Руды' },
  
  // Алхимические ингредиенты
  { id: 'ingredient_blue_mountain_flower', name: 'Голубой горный цветок', icon: '🌸', description: 'Для зелий восстановления', category: 'Алхимия' },
  { id: 'ingredient_lavender', name: 'Лаванда', icon: '💜', description: 'Успокаивающая трава', category: 'Алхимия' },
  { id: 'ingredient_red_mountain_flower', name: 'Красный горный цветок', icon: '🌺', description: 'Для зелий магии', category: 'Алхимия' },
  { id: 'ingredient_thistle_branch', name: 'Ветка чертополоха', icon: '🌿', description: 'Сопротивление магии', category: 'Алхимия' },
  { id: 'ingredient_tundra_cotton', name: 'Тундровый хлопок', icon: '☁️', description: 'Сопротивление морозу', category: 'Алхимия' },
  { id: 'ingredient_snowberry', name: 'Снежная ягода', icon: '❄️', description: 'Сопротивление огню', category: 'Алхимия' },
  { id: 'ingredient_wheat', name: 'Пшеница', icon: '🌾', description: 'Для приготовления пищи', category: 'Алхимия' },
  { id: 'ingredient_nirnroot', name: 'Корень Нирна', icon: '🔮', description: 'Редкий магический корень', category: 'Алхимия' },
  
  // Грибы
  { id: 'ingredient_imp_stool', name: 'Бесовский гриб', icon: '🍄', description: 'Ядовитый гриб', category: 'Грибы' },
  { id: 'ingredient_white_cap', name: 'Белая шапка', icon: '🍄', description: 'Ослабляет иммунитет', category: 'Грибы' },
  { id: 'ingredient_blisterwort', name: 'Волдырник', icon: '🍄', description: 'Восстанавливает здоровье', category: 'Грибы' },
  { id: 'ingredient_glowing_mushroom', name: 'Светящийся гриб', icon: '✨', description: 'Магическое свечение', category: 'Грибы' },
  { id: 'ingredient_mora_tapinella', name: 'Мора Тапинелла', icon: '🍄', description: 'Восстанавливает магию', category: 'Грибы' },
  
  // Материалы
  { id: 'material_firewood', name: 'Дрова', icon: '🪵', description: 'Для крафта и отопления', category: 'Материалы' },
  { id: 'material_charcoal', name: 'Древесный уголь', icon: '⚫', description: 'Для кузнечного дела', category: 'Материалы' },
  { id: 'material_linen', name: 'Льняная ткань', icon: '🧵', description: 'Для одежды', category: 'Материалы' },
  
  // Особые ингредиенты
  { id: 'ingredient_ectoplasm', name: 'Эктоплазма', icon: '👻', description: 'Призрачная субстанция', category: 'Особое' },
  { id: 'ingredient_bone_meal', name: 'Костная мука', icon: '💀', description: 'Из костей нежити', category: 'Особое' },
];

export default function GatheringPage() {
  const { user } = useAuth(true);
  const { toast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [priorityActive, setPriorityActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const char = await fetchCharacter(user.userId);
      setCharacter(char);
      setLoading(false);
    })();
  }, [user]);

  async function gather() {
    if (!character) return;
    setBusy(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/gathering/start', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id }) });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Не удалось добыть ресурс');
      setCharacter(data.character);
      toast({ title: 'Добыча завершена', description: data.log });
    } catch (e: any) {
      toast({ title: 'Ошибка добычи', description: e?.message || 'Попробуйте позже', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function prioritizeGathering(durationMs: number = 5 * 60 * 1000) {
    if (!character) return;
    try {
      setPriorityActive(true);
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      await fetch('/api/ai/priority', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ characterId: character.id, actionType: 'gather_resources', priorityBoost: 3, durationMs }) });
      toast({ title: 'Приоритет установлен', description: 'Герой будет фокусироваться на добыче в течение 5 минут' });
      setTimeout(() => setPriorityActive(false), durationMs);
    } catch {
      setPriorityActive(false);
    }
  }

  // Подсчет добытых ресурсов
  const gatheringStats = useMemo(() => {
    if (!character) return { total: 0, byType: {} };
    
    // Include ores, ingredients, and materials
    const resources = character.inventory.filter(i => 
      i.id.startsWith('ore_') || 
      i.id.startsWith('ingredient_') || 
      i.id.startsWith('material_')
    );
    const total = resources.reduce((sum, r) => sum + r.quantity, 0);
    const byType = resources.reduce((acc, r) => ({ ...acc, [r.id]: r.quantity }), {} as Record<string, number>);
    
    return { total, byType };
  }, [character]);

  if (loading || !character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canGatherHere = character.location.endsWith('_outskirts');
  const staminaRatio = (character.stats.stamina.current / character.stats.stamina.max) * 100;
  const canAffordGathering = character.stats.stamina.current >= 10;

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline flex items-center gap-3">
            <Pickaxe className="h-8 w-8 text-primary" />
            Добыча Ресурсов
          </h1>
          <p className="text-muted-foreground mt-1">
            Добывайте руду и материалы на окраинах городов
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <MapPin className="mr-1 h-3 w-3" />
          {character.location}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Основная карточка добычи */}
        <Card className={canGatherHere ? "border-primary/50" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Pickaxe className="h-5 w-5" />
              Добыча Руды
            </CardTitle>
            <CardDescription>
              {canGatherHere 
                ? "Окраины города — идеальное место для добычи руды"
                : "Добыча доступна только на окраинах городов (локации *_outskirts)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Выносливость */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Выносливость</span>
                <span className="text-sm text-muted-foreground">
                  {character.stats.stamina.current} / {character.stats.stamina.max}
                </span>
              </div>
              <Progress value={staminaRatio} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Каждая добыча требует 10 выносливости
              </p>
            </div>

            <Separator />

            {/* Кнопки действий */}
            <div className="space-y-2">
              <Button 
                onClick={gather} 
                disabled={!canGatherHere || busy || !canAffordGathering || character.status === 'in-combat'}
                className="w-full"
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Добыча...
                  </>
                ) : (
                  <>
                    <Pickaxe className="mr-2 h-4 w-4" />
                    Добыть руду (-10 выносливости)
                  </>
                )}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => prioritizeGathering()} 
                disabled={!canGatherHere || priorityActive || character.status === 'in-combat'}
                className="w-full"
              >
                {priorityActive ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Приоритет активен
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Автоматическая добыча (5 мин)
                  </>
                )}
              </Button>
            </div>

            {!canAffordGathering && canGatherHere && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Недостаточно выносливости для добычи
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статистика добычи */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Package className="h-5 w-5" />
              Добытые Ресурсы
            </CardTitle>
            <CardDescription>
              Всего добыто: {gatheringStats.total} ед.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group resources by category */}
            {['Руды', 'Алхимия', 'Грибы', 'Материалы', 'Особое'].map(category => {
              const categoryResources = resourceTypes.filter(r => r.category === category);
              const categoryTotal = categoryResources.reduce((sum, r) => sum + (gatheringStats.byType[r.id] || 0), 0);
              
              if (categoryTotal === 0 && gatheringStats.total > 0) return null; // Hide empty categories if player has some resources
              
              return (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                  <div className="space-y-2">
                    {categoryResources.slice(0, 5).map(resource => {
                      const count = gatheringStats.byType[resource.id] || 0;
                      const hasResource = count > 0;
                      
                      if (!hasResource && gatheringStats.total > 5) return null; // Hide empty resources if player has many
                      
                      return (
                        <div 
                          key={resource.id} 
                          className={`p-2 rounded-lg border ${hasResource ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-dashed'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{resource.icon}</span>
                              <div>
                                <p className="text-sm font-medium">{resource.name}</p>
                              </div>
                            </div>
                            <Badge variant={hasResource ? "default" : "outline"} className="text-xs">
                              {count}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {gatheringStats.total === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Начните добывать ресурсы для крафта!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Информационная карточка */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            💡 Советы по добыче
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Окраины городов (*_outskirts) — лучшее место для добычи руды</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Используйте "Автоматическую добычу" чтобы герой добывал ресурсы самостоятельно</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Добытые материалы можно использовать для крафта на странице "Крафт"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Следите за выносливостью — без нее добыча невозможна</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


