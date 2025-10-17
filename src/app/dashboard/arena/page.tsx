"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Swords, Eye, FileText } from 'lucide-react';

export default function ArenaPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Моя команда</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">Слоты бойцов (скоро)</div>
              <div className="h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">Синергии и роли</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Очередь</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">Поиск соперника (плейсхолдер)</div>
            </CardContent>
          </Card>
        </div>

        {/* Center column */}
        <div className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Арена</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 rounded bg-gradient-to-b from-muted/70 to-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-semibold">Команда A</div>
                  <div className="text-muted-foreground">VS</div>
                  <div className="text-2xl font-semibold">Команда B</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center">Режим: 1v1 / 3v3</div>
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center">Правила: по умолчанию</div>
                <div className="rounded bg-muted/30 p-2 text-muted-foreground text-center">Рейтинг: —</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Доступные вызовы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 rounded bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">Список вызовов (скоро)</div>
              <div className="h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">Фильтры и поиск</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sticky bottom-0 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-4 py-3 flex flex-wrap gap-3 justify-end">
        <Button variant="default"><Swords className="w-4 h-4 mr-2"/>Создать матч</Button>
        <Button variant="secondary"><Users className="w-4 h-4 mr-2"/>Вызвать</Button>
        <Button variant="outline"><Eye className="w-4 h-4 mr-2"/>Наблюдать</Button>
        <Button variant="ghost"><FileText className="w-4 h-4 mr-2"/>Правила</Button>
      </div>
    </div>
  );
}


