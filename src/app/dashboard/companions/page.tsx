"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import type { Character } from '@/types/character';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Heart,
  Shield,
  Swords,
  Sparkles,
  UserPlus,
  UserMinus,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {companionTemplates} from '@/data/companions';

export default function CompanionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(true);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const char = await fetchCharacter(user.userId);
        if (char) {
          setCharacter(char);
        } else {
          router.push('/create-character');
        }
      } catch (error) {
        console.error('Failed to load character:', error);
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить данные о персонаже.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, router, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="font-headline text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!character) {
    return <div className="flex items-center justify-center h-full w-full font-headline text-xl text-destructive">Персонаж не найден.</div>;
  }

  const availableCompanions = companionTemplates.filter(t => 
    t.availableAt.includes(character.location)
  );

  return (
    <div className="w-full font-body p-4 md:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-headline">Компаньоны</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Нанимайте спутников для помощи в приключениях. Компаньоны помогают в бою, путешествиях и социальных взаимодействиях.
        </p>
      </header>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            <Users className="w-4 h-4 mr-2" />
            Активный
          </TabsTrigger>
          <TabsTrigger value="roster">
            <Heart className="w-4 h-4 mr-2" />
            Отряд
          </TabsTrigger>
          <TabsTrigger value="recruit">
            <UserPlus className="w-4 h-4 mr-2" />
            Нанять
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {!character.activeCompanion ? (
            <Card className="flex flex-col items-center justify-center h-64 border-dashed">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Нет активного компаньона</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                У вас нет активного спутника. Наймите компаньона на вкладке "Нанять" или активируйте из отряда.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация о компаньоне</CardTitle>
                  <CardDescription>Текущий активный спутник</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Функционал активных компаньонов будет доступен после внедрения системы хранения.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <Card className="flex flex-col items-center justify-center h-64 border-dashed">
            <UserMinus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Отряд пуст</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Нанятые компаньоны будут отображаться здесь.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="recruit" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCompanions.length === 0 ? (
              <Card className="col-span-full flex flex-col items-center justify-center h-64 border-dashed">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Нет доступных компаньонов</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  В этой локации нет компаньонов для найма. Попробуйте другие города.
                </p>
              </Card>
            ) : (
              availableCompanions.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {template.class === 'warrior' && <Swords className="h-5 w-5" />}
                          {template.class === 'mage' && <Sparkles className="h-5 w-5" />}
                          {template.class === 'rogue' && <Shield className="h-5 w-5" />}
                          {template.namePool[0]}
                        </CardTitle>
                        <CardDescription className="capitalize mt-1">
                          {template.class === 'warrior' && 'Воин'}
                          {template.class === 'mage' && 'Маг'}
                          {template.class === 'rogue' && 'Разбойник'}
                          {template.class === 'healer' && 'Целитель'}
                          {template.class === 'ranger' && 'Следопыт'}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        template.rarity === 'legendary' ? 'default' :
                        template.rarity === 'rare' ? 'secondary' :
                        template.rarity === 'uncommon' ? 'outline' : 'secondary'
                      }>
                        {template.rarity === 'common' && 'Обычный'}
                        {template.rarity === 'uncommon' && 'Необычный'}
                        {template.rarity === 'rare' && 'Редкий'}
                        {template.rarity === 'legendary' && 'Легендарный'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{template.bio}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Здоровье:</span>
                        <span className="font-medium">{template.baseStats.health.max}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Урон:</span>
                        <span className="font-medium">{template.baseStats.damage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Защита:</span>
                        <span className="font-medium">{template.baseStats.defense}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3 mb-4">
                      <p className="text-xs font-semibold mb-2">Способности:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.availableAbilities.map((ability) => (
                          <Badge key={ability.id} variant="outline" className="text-xs">
                            {ability.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Стоимость найма</p>
                        <p className="font-semibold text-amber-600">{template.recruitCost} 🪙</p>
                      </div>
                      <Button size="sm" disabled>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Нанять
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Содержание: {template.upkeepCost} 🪙/день, {template.foodConsumption} 🍖/день
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
