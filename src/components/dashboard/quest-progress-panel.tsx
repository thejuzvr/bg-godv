"use client";

import type { Character } from "@/types/character";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Task = { id: string; title: string; type: string; status: 'pending'|'in-progress'|'completed'|'failed'; progress: number };

export function QuestProgressPanel({ quest }: { quest: { id: string; title: string; progress: number; tasks: Task[] } | null }) {
  if (!quest) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Активное задание: {quest.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Прогресс</span>
            <span className="font-mono text-muted-foreground">{quest.progress}%</span>
          </div>
          <Progress value={quest.progress} className="h-2" />
        </div>
        <div className="space-y-2">
          {quest.tasks.map((t) => (
            <div key={t.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{t.title}</span>
                <span className="text-muted-foreground">{symbolFor(t.status)} {labelFor(t.status)}</span>
              </div>
              <Progress value={t.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function labelFor(status: Task['status']): string {
  switch (status) {
    case 'pending': return 'ожидает';
    case 'in-progress': return 'в процессе';
    case 'completed': return 'выполнено';
    case 'failed': return 'провалено';
  }
}
function symbolFor(status: Task['status']): string {
  switch (status) {
    case 'pending': return '⏳';
    case 'in-progress': return '⚙️';
    case 'completed': return '✅';
    case 'failed': return '❌';
  }
}


