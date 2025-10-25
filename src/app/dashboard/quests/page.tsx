"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Character } from '@/types/character';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Target, Star, Clock, Award, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuestDB = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  status: string;
  progress: number;
  priority: number;
  isActive: boolean;
  rewards: {
    gold?: number;
    xp?: number;
    items?: Array<{ id: string; quantity: number }>;
    randomItemRewards?: Array<{ rarity: string; type: string; quantity: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

type QuestTaskDB = {
  id: string;
  questId: string;
  idx: number;
  title: string;
  type: string;
  status: string;
  progress: number;
};

export default function QuestsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [activeQuest, setActiveQuest] = useState<QuestDB | null>(null);
    const [activeTasks, setActiveTasks] = useState<QuestTaskDB[]>([]);
    const [inProgressQuests, setInProgressQuests] = useState<QuestDB[]>([]);
    const [availableQuests, setAvailableQuests] = useState<QuestDB[]>([]);
    const [completedQuests, setCompletedQuests] = useState<QuestDB[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuest, setSelectedQuest] = useState<QuestDB | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<QuestTaskDB[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const char = await fetchCharacter(user.userId);
                if (!char) {
                    router.push('/create-character');
                    return;
                }
                setCharacter(char);
                await loadQuests(char.id);
            } catch (error) {
                toast({ title: "Ошибка", description: "Не удалось загрузить данные.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);

    // Auto-refresh quests every 5 seconds
    useEffect(() => {
        if (!character?.id) return;

        const intervalId = setInterval(() => {
            loadQuests(character.id);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [character?.id]);

    const loadQuests = async (characterId: string) => {
        try {
            // Load active quest
            const activeResp = await fetch(`/api/quests/active?characterId=${characterId}`);
            const activeData = await activeResp.json();
            if (activeData.ok && activeData.quest) {
                setActiveQuest(activeData.quest);
                setActiveTasks(activeData.tasks || []);
            }

            // Load all quests for this character
            const allResp = await fetch(`/api/quests?characterId=${characterId}`);
            const allData = await allResp.json();
            if (allData.ok && allData.quests) {
                const quests = allData.quests;
                setInProgressQuests(quests.filter((q: QuestDB) => q.status === 'in-progress' && !q.isActive));
                setAvailableQuests(quests.filter((q: QuestDB) => q.status === 'available'));
                setCompletedQuests(quests.filter((q: QuestDB) => q.status === 'completed'));
            }
        } catch (error) {
            console.error('Error loading quests:', error);
        }
    };

    const handleSetActive = async (questId: string) => {
        if (!character) return;
        setActionLoading(true);
        try {
            const resp = await fetch('/api/quests/set-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: character.id, questId })
            });
            const data = await resp.json();
            if (data.ok) {
                toast({ title: "✨ Божественное вмешательство", description: "Герой теперь сфокусирован на этом задании!" });
                await loadQuests(character.id);
                setDialogOpen(false);
            } else {
                toast({ title: "Ошибка", description: data.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось установить активное задание.", variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
    };

    const openQuestDialog = async (quest: QuestDB) => {
        setSelectedQuest(quest);
        // Load tasks for this quest
        try {
            const resp = await fetch(`/api/quests/${quest.id}`);
            const data = await resp.json();
            if (data.ok && data.quest) {
                setSelectedTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Error loading quest details:', error);
        }
        setDialogOpen(true);
    };
    
    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка журнала заданий...</div>;
    }

    if (!character) {
        return null;
    }

    return (
        <div className="w-full font-body p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3">
                    <BookOpen /> Журнал Заданий
                </h1>
            </header>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <Target className="h-4 w-4" /> Активное {activeQuest && '(1)'}
                    </TabsTrigger>
                    <TabsTrigger value="in-progress" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> В процессе ({inProgressQuests.length})
                    </TabsTrigger>
                    <TabsTrigger value="available" className="flex items-center gap-2">
                        <Award className="h-4 w-4" /> Доступные ({availableQuests.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        ✅ Завершённые ({completedQuests.length})
                    </TabsTrigger>
                </TabsList>

                {/* Active Quest Tab */}
                <TabsContent value="active" className="space-y-4">
                    {activeQuest ? (
                        <Card className="border-2 border-amber-500/50">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="h-5 w-5 text-amber-500" />
                                            <Badge variant="default" className="bg-amber-500">Активное</Badge>
                                            <Badge variant="outline">{getQuestTypeLabel(activeQuest.type)}</Badge>
                                        </div>
                                        <CardTitle className="text-2xl">{activeQuest.title}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getPriorityStars(activeQuest.priority)}
                                    </div>
                                </div>
                                <CardDescription className="text-base mt-2">{activeQuest.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium">Общий прогресс</span>
                                        <span className="font-mono">{activeQuest.progress}%</span>
                                    </div>
                                    <Progress value={activeQuest.progress} className="h-3" />
                                </div>

                                {activeTasks.length > 0 && (
                                    <div className="space-y-3 mt-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground">Подзадачи:</h3>
                                        {activeTasks.map((task, idx) => (
                                            <div key={task.id} className="flex items-start gap-3 pl-4 border-l-2">
                                                <span className="text-muted-foreground">{idx + 1}.</span>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                                            {task.title}
                                                        </span>
                                                        <span>{getTaskStatusIcon(task.status)}</span>
                                                    </div>
                                                    {task.status !== 'pending' && (
                                                        <Progress value={task.progress} className="h-1.5" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-sm font-semibold mb-2">💰 Награды:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {activeQuest.rewards.gold && <Badge variant="outline">{activeQuest.rewards.gold} золота</Badge>}
                                        {activeQuest.rewards.xp && <Badge variant="outline">{activeQuest.rewards.xp} XP</Badge>}
                                        {activeQuest.rewards.items && activeQuest.rewards.items.map((item, idx) => (
                                            <Badge key={idx} variant="outline">{item.id} x{item.quantity}</Badge>
                                        ))}
                                        {activeQuest.rewards.randomItemRewards && activeQuest.rewards.randomItemRewards.map((reward, idx) => (
                                            <Badge key={idx} variant="outline">{reward.rarity} {reward.type} x{reward.quantity}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => openQuestDialog(activeQuest)}
                                >
                                    Подробнее <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-lg text-muted-foreground">Нет активного задания</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Выберите задание из вкладки "В процессе" или "Доступные"
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* In Progress Tab */}
                <TabsContent value="in-progress" className="space-y-4">
                    <ScrollArea className="h-[70vh]">
                        <div className="space-y-4 pr-4">
                            {inProgressQuests.length > 0 ? (
                                inProgressQuests.map(quest => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        onSetActive={() => handleSetActive(quest.id)}
                                        onDetails={() => openQuestDialog(quest)}
                                        actionLoading={actionLoading}
                                    />
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        У вас нет других заданий в процессе
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Available Tab */}
                <TabsContent value="available" className="space-y-4">
                    <ScrollArea className="h-[70vh]">
                        <div className="space-y-4 pr-4">
                            {availableQuests.length > 0 ? (
                                availableQuests.map(quest => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        onDetails={() => openQuestDialog(quest)}
                                        isAvailable={true}
                                    />
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        Нет доступных заданий
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Completed Tab */}
                <TabsContent value="completed" className="space-y-4">
                    <ScrollArea className="h-[70vh]">
                        <div className="space-y-4 pr-4">
                            {completedQuests.length > 0 ? (
                                completedQuests.map(quest => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        onDetails={() => openQuestDialog(quest)}
                                        isCompleted={true}
                                    />
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        Вы еще не выполнили ни одного задания
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>

            {/* Quest Details Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedQuest && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="text-2xl">{selectedQuest.title}</DialogTitle>
                                    <div className="flex items-center gap-1">
                                        {getPriorityStars(selectedQuest.priority)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge>{getQuestTypeLabel(selectedQuest.type)}</Badge>
                                    <Badge variant="outline">{selectedQuest.location}</Badge>
                                    <Badge variant="secondary">Приоритет: {selectedQuest.priority}/100</Badge>
                                </div>
                                <DialogDescription className="text-base mt-4">
                                    {selectedQuest.description}
                                </DialogDescription>
                            </DialogHeader>

                            {selectedTasks.length > 0 && (
                                <div className="space-y-3 my-4">
                                    <h3 className="font-semibold">Подзадачи:</h3>
                                    {selectedTasks.map((task, idx) => (
                                        <div key={task.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded">
                                            <span className="text-muted-foreground">{idx + 1}.</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span>{task.title}</span>
                                                    <span>{getTaskStatusIcon(task.status)}</span>
                                                </div>
                                                <Progress value={task.progress} className="h-1.5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2 my-4">
                                <h3 className="font-semibold">Награды:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedQuest.rewards.gold && <Badge variant="outline">{selectedQuest.rewards.gold} золота</Badge>}
                                    {selectedQuest.rewards.xp && <Badge variant="outline">{selectedQuest.rewards.xp} XP</Badge>}
                                </div>
                            </div>

                            <DialogFooter>
                                {selectedQuest.status === 'in-progress' && !selectedQuest.isActive && (
                                    <Button
                                        onClick={() => handleSetActive(selectedQuest.id)}
                                        disabled={actionLoading}
                                        className="w-full"
                                    >
                                        ⭐ Сделать активным
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function QuestCard({ 
    quest, 
    onSetActive, 
    onDetails, 
    isAvailable = false, 
    isCompleted = false,
    actionLoading = false 
}: { 
    quest: QuestDB; 
    onSetActive?: () => void; 
    onDetails: () => void;
    isAvailable?: boolean;
    isCompleted?: boolean;
    actionLoading?: boolean;
}) {
    return (
        <Card className={isCompleted ? 'opacity-70' : ''}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{getQuestTypeLabel(quest.type)}</Badge>
                            <span className="text-xs text-muted-foreground">{quest.location}</span>
                        </div>
                        <CardTitle className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                            {quest.title}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        {getPriorityStars(quest.priority)}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>
                
                {!isCompleted && !isAvailable && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Прогресс</span>
                            <span className="font-mono">{quest.progress}%</span>
                        </div>
                        <Progress value={quest.progress} className="h-2" />
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                    {quest.rewards.gold && <Badge variant="secondary">{quest.rewards.gold} золота</Badge>}
                    {quest.rewards.xp && <Badge variant="secondary">{quest.rewards.xp} XP</Badge>}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onDetails} className="flex-1">
                        Подробнее
                    </Button>
                    {onSetActive && !isCompleted && !isAvailable && (
                        <Button onClick={onSetActive} disabled={actionLoading} className="flex-1">
                            ⭐ Активировать
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper Functions
function getPriorityStars(priority: number) {
    const starCount = Math.ceil(priority / 20);
    return [...Array(5)].map((_, i) => (
        <Star
            key={i}
            className={`h-4 w-4 ${
                i < starCount 
                    ? 'fill-amber-500 text-amber-500' 
                    : 'text-gray-300 dark:text-gray-600'
            }`}
        />
    ));
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

function getTaskStatusIcon(status: string): string {
    switch (status) {
        case 'pending': return '⏳';
        case 'in-progress': return '⚙️';
        case 'completed': return '✅';
        case 'failed': return '❌';
        default: return '';
    }
}
