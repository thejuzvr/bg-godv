
"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Heart,
  Shield,
  History,
  Settings,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

export default function SocialPage() {
  const [interactionFilter, setInteractionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  return (
    <div className="w-full font-body p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline text-primary">Социальные взаимодействия</h1>
      </header>

      <Tabs defaultValue="interaction-history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="local-npcs">
            <Users className="w-4 h-4 mr-2" />
            Локальные NPC
          </TabsTrigger>
          <TabsTrigger value="all-relationships">
            <Heart className="w-4 h-4 mr-2" />
            Все отношения
          </TabsTrigger>
          <TabsTrigger value="faction-standing">
            <Shield className="w-4 h-4 mr-2" />
            Репутация
          </TabsTrigger>
          <TabsTrigger value="interaction-history">
            <History className="w-4 h-4 mr-2" />
            История
          </TabsTrigger>
          <TabsTrigger value="social-settings">
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="local-npcs" className="mt-6">
            <Card className="flex items-center justify-center h-64 border-dashed">
                <p className="text-center text-muted-foreground">Здесь будут отображаться NPC в текущей локации.</p>
            </Card>
        </TabsContent>
        <TabsContent value="all-relationships" className="mt-6">
            <Card className="flex items-center justify-center h-64 border-dashed">
                <p className="text-center text-muted-foreground">Здесь будет список всех NPC и ваши отношения с ними.</p>
            </Card>
        </TabsContent>
        <TabsContent value="faction-standing" className="mt-6">
            <Card className="flex items-center justify-center h-64 border-dashed">
             <p className="text-center text-muted-foreground">Здесь будет подробная информация о вашей репутации с фракциями.</p>
            </Card>
        </TabsContent>

        <TabsContent value="interaction-history" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1.5">Фильтр</label>
                      <Select value={interactionFilter} onValueChange={setInteractionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Тип взаимодействия" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все взаимодействия</SelectItem>
                          <SelectItem value="dialogues">Диалоги</SelectItem>
                          <SelectItem value="trade">Торговля</SelectItem>
                          <SelectItem value="quests">Задания</SelectItem>
                          <SelectItem value="successful">Успешные</SelectItem>
                          <SelectItem value="failed">Неудачные</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1.5">Сортировка</label>
                       <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Сортировать по..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Сначала новые</SelectItem>
                          <SelectItem value="oldest">Сначала старые</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">Показано: 0 из 0 взаимодействий</p>
                    <div className="text-center py-10">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-lg font-semibold">Взаимодействия не найдены</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить фильтры поиска.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="flex items-center justify-center h-full min-h-[300px] border-dashed">
                    <div className="text-center text-muted-foreground">
                        <UserPlus className="mx-auto h-16 w-16" />
                        <h3 className="mt-4 text-xl font-semibold text-foreground">SELECT AN NPC</h3>
                        <p className="mt-2 text-sm">
                            Click on any NPC to view detailed relationship
                            <br />
                            information and interaction options.
                        </p>
                    </div>
                </Card>
            </div>
          </div>
        </TabsContent>
         <TabsContent value="social-settings" className="mt-6">
            <Card className="flex items-center justify-center h-64 border-dashed">
                <p className="text-center text-muted-foreground">Здесь будут настройки социальных взаимодействий.</p>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
