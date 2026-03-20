"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Swords, Eye, FileText } from 'lucide-react';

export default function ArenaPage() {
  return (
    <div className="p-4 md:p-8 space-y-4 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-4 md:space-y-8 font-body">
          <Card className="font-body">
            <CardHeader className="font-body">
              <CardTitle className="font-headline">Моя команда</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body">
              <div className="h-24 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground font-body">Слоты бойцов (скоро)</div>
              <div className="h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground font-body">Синергии и роли</div>
            </CardContent>
          </Card>
          <Card className="font-body">
            <CardHeader className="font-body">
              <CardTitle className="font-headline">Очередь</CardTitle>
            </CardHeader>
            <CardContent className="font-body">
              <div className="h-28 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground font-body">Поиск соперника (плейсхолдер)</div>
            </CardContent>
          </Card>
        </div>

        {/* Center column */}
        <div className="lg:col-span-6 space-y-4 md:space-y-8 font-body">
          <Card className="font-body">
            <CardHeader className="font-body">
              <CardTitle className="font-headline text-xl">Арена</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-body">
              <div className="h-64 rounded bg-gradient-to-b from-muted/70 to-muted/30 flex items-center justify-center font-body">
                <div className="text-center font-body">
                  <div className="text-2xl font-semibold font-headline">Команда A</div>
                  <div className="text-muted-foreground font-body">VS</div>
                  <div className="text-2xl font-semibold font-headline">Команда B</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-sm font-body">
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center font-body">Режим: 1v1 / 3v3</div>
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center font-body">Правила: по умолчанию</div>
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center font-body">Рейтинг: —</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4 md:space-y-8 font-body">
          <Card className="font-body">
            <CardHeader className="font-body">
              <CardTitle className="font-headline">Доступные вызовы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body">
              <div className="h-24 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground font-body">Список вызовов (скоро)</div>
              <div className="h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground font-body">Фильтры и поиск</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-4 py-3 flex flex-wrap gap-3 justify-end font-body">
        <Button variant="default" className="font-body"><Swords className="w-4 h-4 mr-2"/>Создать матч</Button>
        <Button variant="secondary" className="font-body"><Users className="w-4 h-4 mr-2"/>Вызвать</Button>
        <Button variant="outline" className="font-body"><Eye className="w-4 h-4 mr-2"/>Наблюдать</Button>
        <Button variant="ghost" className="font-body"><FileText className="w-4 h-4 mr-2"/>Правила</Button>
      </div>
    </div>
  );
}


