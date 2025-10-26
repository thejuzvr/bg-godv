"use client";

import type { Character } from "@/types/character";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Star } from "lucide-react";

type Task = { id: string; title: string; type: string; status: 'pending'|'in-progress'|'completed'|'failed'; progress: number };

type QuestProgressPanelProps = {
  quest: { 
    id: string; 
    title: string; 
    progress: number; 
    tasks?: Task[];
    priority?: number;
    type?: string;
  } | null;
};

export function QuestProgressPanel({ quest }: QuestProgressPanelProps) {
  if (!quest) return null;
  
  const isMultiStep = quest.tasks && quest.tasks.length > 0;
  const priorityStars = getPriorityStars(quest.priority || 50);
  
  return (
    <Card className="border-2 border-amber-500/30 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            <CardTitle className="font-headline text-lg">{quest.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1" title={`Приоритет: ${quest.priority || 50}/100`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < priorityStars 
                    ? 'fill-amber-500 text-amber-500' 
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            🎯 Активное
          </Badge>
          {quest.type && (
            <Badge variant="outline" className="text-xs">
              {getQuestTypeLabel(quest.type)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {isMultiStep ? 'Общий прогресс' : 'Прогресс'}
            </span>
            <span className="font-mono text-muted-foreground font-semibold">
              {quest.progress}%
            </span>
          </div>
          <Progress value={quest.progress} className="h-2.5" />
        </div>
        
        {/* Tasks (for multi-step quests) */}
        {isMultiStep && (
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Подзадачи:
            </div>
            {quest.tasks!.map((t, idx) => (
              <div key={t.id} className="space-y-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{idx + 1}.</span>
                    <span className={t.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      {t.title}
                    </span>
                  </div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    {symbolFor(t.status)} 
                    <span className="text-xs">{labelFor(t.status)}</span>
                  </span>
                </div>
                {t.status !== 'pending' && (
                  <Progress value={t.progress} className="h-1.5 ml-5" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Simple quest description */}
        {!isMultiStep && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Задание выполняется. Прогресс обновляется автоматически.
          </div>
        )}
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

function getPriorityStars(priority: number): number {
  if (priority >= 81) return 5;
  if (priority >= 61) return 4;
  if (priority >= 41) return 3;
  if (priority >= 21) return 2;
  return 1;
}

function getQuestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    main: 'Основной',
    side: 'Побочный',
    bounty: 'Награда',
    urgent: 'Срочный',
  };
  return labels[type] || type;
}


