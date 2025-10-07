
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { ChronicleEntry } from '@/types/chronicle';
import { fetchChronicleEntries } from '@/services/chronicleService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookMarked } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as LucideIcons from "lucide-react";

// Helper to get a Lucide icon by its string name
const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <BookMarked {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};

export default function ChroniclePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [entries, setEntries] = useState<ChronicleEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const chronicleEntries = await fetchChronicleEntries(user.userId);
                setEntries(chronicleEntries);
            } catch (error) {
                toast({ title: "Ошибка", description: "Не удалось загрузить летопись.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);

    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка летописи...</div>;
    }

    return (
        <div className="w-full font-body p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3"><BookMarked /> Летопись</h1>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Хроника подвигов</CardTitle>
                    <CardDescription>Ключевые моменты из жизни вашего героя.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[70vh]">
                        {entries.length > 0 ? (
                            <div className="space-y-6 pr-4">
                                {entries.map((entry) => (
                                    <div key={entry.id} className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Icon name={entry.icon} className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-headline text-lg text-primary">{entry.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: ru })}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Летопись пока пуста.</p>
                                <p className="text-sm">Великие дела еще впереди!</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
