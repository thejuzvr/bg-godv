"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import type { Character } from '@/types/character';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search, 
  Store, 
  Package,
  Loader2,
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sword,
  Shield,
  Scroll,
  Gem,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = { itemId: string; price: number; supply: number; demand: number };

// Item categories mapping
const itemCategories: Record<string, { name: string; icon: keyof typeof LucideIcons; color: string }> = {
  ore: { name: 'Руды', icon: Gem, color: 'text-amber-600' },
  potion: { name: 'Зелья', icon: Sparkles, color: 'text-purple-600' },
  weapon: { name: 'Оружие', icon: Sword, color: 'text-red-600' },
  armor: { name: 'Броня', icon: Shield, color: 'text-blue-600' },
  misc: { name: 'Разное', icon: Package, color: 'text-gray-600' },
  scroll: { name: 'Свитки', icon: Scroll, color: 'text-indigo-600' },
};

function getItemCategory(itemId: string): keyof typeof itemCategories {
  if (itemId.includes('ore_')) return 'ore';
  if (itemId.includes('potion_')) return 'potion';
  if (itemId.includes('weapon_')) return 'weapon';
  if (itemId.includes('armor_')) return 'armor';
  if (itemId.includes('scroll_')) return 'scroll';
  return 'misc';
}

function getItemDisplayName(itemId: string): string {
  const names: Record<string, string> = {
    'ore_iron': 'Железная руда',
    'ore_silver': 'Серебряная руда',
    'ore_gold': 'Золотая руда',
    'potion_health_weak': 'Слабое зелье здоровья',
    'misc_gem_amethyst': 'Аметист',
  };
  return names[itemId] || itemId.replace(/_/g, ' ');
}

export default function MarketPage() {
  const { user } = useAuth(true);
  const { toast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [market, setMarket] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'demand'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<Row | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isTrading, setIsTrading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const char = await fetchCharacter(user.userId);
      setCharacter(char);
      const resp = await fetch('/api/market/list');
      const data = await resp.json();
      setMarket(data.market || []);
      setLoading(false);
    })();
  }, [user]);

  async function trade(side: 'buy'|'sell', itemId: string, qty: number) {
    if (!character) return;
    
    setIsTrading(true);
    try {
      const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
      const resp = await fetch('/api/market/trade', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, 
        body: JSON.stringify({ characterId: character.id, itemId, qty, side }) 
      });
      const data = await resp.json();
      
      if (!data.success) throw new Error(data.error || 'Сделка не удалась');
      
      setCharacter(data.character);
      toast({ 
        title: side === 'buy' ? '✅ Покупка выполнена' : '💰 Продажа выполнена',
        description: `${getItemDisplayName(itemId)} x${qty} за ${Math.ceil((market.find(m => m.itemId === itemId)?.price || 0) * qty)} золота`,
        duration: 4000,
      });
      
      // refresh market
      const r2 = await fetch('/api/market/list');
      const d2 = await r2.json();
      setMarket(d2.market || []);
      setQuantity(1);
    } catch (e: unknown) {
      toast({ 
        title: 'Ошибка', 
        description: e?.message || 'Попробуйте позже',
        variant: 'destructive' 
      });
    } finally {
      setIsTrading(false);
    }
  }

  const gold = useMemo(() => (character?.inventory.find(i => i.id === 'gold')?.quantity || 0), [character]);

  const filteredAndSortedMarket = useMemo(() => {
    let result = [...market];

    // Filter by search
    if (searchQuery) {
      result = result.filter(row => 
        getItemDisplayName(row.itemId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.itemId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(row => getItemCategory(row.itemId) === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = getItemDisplayName(a.itemId).localeCompare(getItemDisplayName(b.itemId));
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'demand') {
        comparison = a.demand - b.demand;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [market, searchQuery, selectedCategory, sortBy, sortOrder]);

  const getTrend = (row: Row) => {
    const ratio = row.demand / Math.max(1, row.supply);
    if (ratio > 1.2) return 'up';
    if (ratio < 0.8) return 'down';
    return 'stable';
  };

  const getPlayerItemQuantity = (itemId: string) => {
    return character?.inventory.find(i => i.id === itemId)?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Store className="h-8 w-8 text-amber-600" />
            Глобальный Рынок
          </h1>
          <p className="text-muted-foreground mt-1">
            Торгуйте предметами с автоматической ценой на основе спроса и предложения
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Coins className="mr-2 h-5 w-5 text-amber-500" />
          {gold.toLocaleString()} золота
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Товаров на рынке</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{market.length}</div>
            <p className="text-xs text-muted-foreground">Доступно для торговли</p>
          </CardContent>
        </Card>
        
        <Card className="font-body">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
            <CardTitle className="text-sm font-medium font-body">Общий объем</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="font-body">
            <div className="text-2xl font-bold font-body">
              {market.reduce((sum, row) => sum + row.supply + row.demand, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground font-body">Предложение + Спрос</p>
          </CardContent>
        </Card>
        
        <Card className="font-body">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
            <CardTitle className="text-sm font-medium font-body">Ваш инвентарь</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="font-body">
            <div className="text-2xl font-bold font-body">
              {character?.inventory.filter(i => i.id !== 'gold').length || 0}
            </div>
            <p className="text-xs text-muted-foreground font-body">Уникальных предметов</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="font-body">
        <CardHeader className="font-body">
          <CardTitle className="text-lg font-headline">Фильтры и поиск</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 font-body">
          <div className="flex gap-4 flex-wrap font-body">
            <div className="flex-1 min-w-[200px] font-body">
              <div className="relative font-body">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-body"
                />
              </div>
            </div>
            
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full font-body">
              <TabsList className="grid grid-cols-7 w-full font-body">
                <TabsTrigger value="all" className="font-body">Все</TabsTrigger>
                {Object.entries(itemCategories).map(([key, { name, icon: Icon }]) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-1 font-body">
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline font-body">{name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex gap-2 items-center font-body">
            <span className="text-sm text-muted-foreground font-body">Сортировка:</span>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              className="font-body"
              onClick={() => {
                if (sortBy === 'name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('name');
                  setSortOrder('asc');
                }
              }}
            >
              Название {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              className="font-body"
              onClick={() => {
                if (sortBy === 'price') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('price');
                  setSortOrder('asc');
                }
              }}
            >
              Цена {sortBy === 'price' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'demand' ? 'default' : 'outline'}
              size="sm"
              className="font-body"
              onClick={() => {
                if (sortBy === 'demand') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('demand');
                  setSortOrder('asc');
                }
              }}
            >
              Спрос {sortBy === 'demand' && (sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Items Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 font-body">
        {filteredAndSortedMarket.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Товары не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedMarket.map((row, idx) => {
            const category = getItemCategory(row.itemId);
            const CategoryIcon = itemCategories[category].icon;
            const trend = getTrend(row);
            const playerHas = getPlayerItemQuantity(row.itemId);
            const isSelected = selectedItem?.itemId === row.itemId;

            return (
              <Card 
                key={row.itemId} 
                className={cn(
                  "transition-all duration-300 hover:shadow-lg hover:scale-105",
                  isSelected && "ring-2 ring-primary",
                  "animate-in fade-in-0 slide-in-from-bottom-4"
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={cn("h-5 w-5", itemCategories[category].color)} />
                      <CardTitle className="font-headline text-lg">
                        {getItemDisplayName(row.itemId)}
                      </CardTitle>
                    </div>
                    {trend === 'up' && <Badge variant="default" className="bg-green-600"><TrendingUp className="h-3 w-3 mr-1" />Растет</Badge>}
                    {trend === 'down' && <Badge variant="default" className="bg-red-600"><TrendingDown className="h-3 w-3 mr-1" />Падает</Badge>}
                    {trend === 'stable' && <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Стабильно</Badge>}
                  </div>
                  <CardDescription className="text-xs">
                    {itemCategories[category].name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Price */}
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <span className="text-sm font-medium">Цена за единицу</span>
                    <span className="text-xl font-bold text-amber-600 flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      {Math.ceil(row.price)}
                    </span>
                  </div>

                  {/* Market Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Предложение</p>
                      <p className="font-semibold text-green-600">{row.supply}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Спрос</p>
                      <p className="font-semibold text-blue-600">{row.demand}</p>
                    </div>
                  </div>

                  {playerHas > 0 && (
                    <Badge variant="outline" className="w-full justify-center">
                      У вас: {playerHas} шт.
                    </Badge>
                  )}

                  <Separator />

                  {/* Quantity Selector */}
                  {isSelected && (
                    <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                          className="w-20 text-center"
                          min={1}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-auto">
                          = {Math.ceil(row.price * quantity)} <Coins className="inline h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => {
                        if (isSelected) {
                          trade('buy', row.itemId, quantity);
                        } else {
                          setSelectedItem(row);
                          setQuantity(1);
                        }
                      }}
                      disabled={isTrading || gold < Math.ceil(row.price * (isSelected ? quantity : 1))}
                    >
                      {isTrading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 mr-1" />
                      )}
                      {isSelected ? `Купить (${quantity})` : 'Купить'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => {
                        if (isSelected) {
                          trade('sell', row.itemId, quantity);
                        } else {
                          setSelectedItem(row);
                          setQuantity(1);
                        }
                      }}
                      disabled={isTrading || playerHas < (isSelected ? quantity : 1)}
                    >
                      {isTrading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Coins className="h-4 w-4 mr-1" />
                      )}
                      {isSelected ? `Продать (${quantity})` : 'Продать'}
                    </Button>
                  </div>
                  
                  {isSelected && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedItem(null);
                        setQuantity(1);
                      }}
                    >
                      Отменить
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


