"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Heart, Swords, Shield, Sparkles, Eye, Crosshair, Users } from "lucide-react";
import type { CharacterCompanionDB } from "@/../shared/schema";

interface ActiveCompanionPanelProps {
  companion: CharacterCompanionDB | null;
}

const getCompanionIcon = (companionClass: string) => {
  switch (companionClass) {
    case 'warrior':
      return Swords;
    case 'mage':
      return Sparkles;
    case 'rogue':
      return Eye;
    case 'healer':
      return Heart;
    case 'ranger':
      return Crosshair;
    default:
      return Users;
  }
};

const getClassLabel = (companionClass: string) => {
  switch (companionClass) {
    case 'warrior':
      return 'Воин';
    case 'mage':
      return 'Маг';
    case 'rogue':
      return 'Разбойник';
    case 'healer':
      return 'Целитель';
    case 'ranger':
      return 'Следопыт';
    default:
      return companionClass;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return 'bg-orange-600';
    case 'rare':
      return 'bg-purple-600';
    case 'uncommon':
      return 'bg-blue-600';
    default:
      return 'bg-muted-foreground';
  }
};

export function ActiveCompanionPanel({ companion }: ActiveCompanionPanelProps) {
  if (!companion) {
    return (
      <Card className="font-body">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 font-headline">
            <Users className="h-5 w-5 text-muted-foreground" />
            Активный Компаньон
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <Users className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Нет активного компаньона
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Нанимайте спутников в разделе &quot;Социальная Жизнь&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CompanionIcon = getCompanionIcon(companion.class);
  const stats = companion.stats as any;
  const skills = companion.skills as any;
  const personality = companion.personality as any;
  const healthPercent = (stats.health.current / stats.health.max) * 100;

  return (
    <Card className="font-body">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2 font-headline">
              <CompanionIcon className="h-5 w-5 text-primary" />
              {companion.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{getClassLabel(companion.class)}</span>
              <span>•</span>
              <span>Ур. {companion.level}</span>
            </CardDescription>
          </div>
          <Badge 
            variant="default" 
            className={`${getRarityColor(companion.rarity)} text-white`}
          >
            {companion.rarity === 'legendary' ? 'Легендарный' : 
             companion.rarity === 'rare' ? 'Редкий' :
             companion.rarity === 'uncommon' ? 'Необычный' : 'Обычный'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Здоровье */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Здоровье
            </span>
            <span className="text-xs font-mono">
              {stats.health.current}/{stats.health.max}
            </span>
          </div>
          <Progress value={healthPercent} className="h-2" />
        </div>

        <Separator />

        {/* Характеристики */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Swords className="h-3 w-3" />
              Урон
            </span>
            <span className="font-medium">{stats.damage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Броня
            </span>
            <span className="font-medium">{stats.armor}</span>
          </div>
        </div>

        <Separator />

        {/* Навыки */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground">Навыки</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Бой</span>
              <span className="font-medium">{skills.combat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Магия</span>
              <span className="font-medium">{skills.magic}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Скрытность</span>
              <span className="font-medium">{skills.stealth}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Настроение и лояльность */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Настроение</span>
              <span className="font-medium">{companion.mood}/100</span>
            </div>
            <Progress value={companion.mood} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Лояльность</span>
              <span className="font-medium">{personality.loyalty}/100</span>
            </div>
            <Progress value={personality.loyalty} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
