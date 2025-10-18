"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { seedDatabase, seedFromJson, fixCharacterState, fetchAllCharacters, deleteCharacter, type AdminCharacterView } from "./actions";
import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPage() {
    const { toast } = useToast();
    const { user, loading } = useAuth(true);
    const [isSeeding, setIsSeeding] = useState(false);

    const [isJsonSeeding, setIsJsonSeeding] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [jsonContents, setJsonContents] = useState({
        items: '',
        enemies: '',
        quests: '',
        sovngardeQuests: '',
        npcs: '',
        events: '',
        cityEvents: '',
    });
    const [activeTab, setActiveTab] = useState('items');

    const [characters, setCharacters] = useState<AdminCharacterView[]>([]);
    const [isCharacterLoading, setIsCharacterLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCharacters = async () => {
        setIsCharacterLoading(true);
        try {
            const result = await fetchAllCharacters();
            if (result.success && result.characters) {
                setCharacters(result.characters);
            } else {
                 toast({ title: "Ошибка", description: result.error || "Не удалось загрузить список героев.", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Ошибка", description: error.message || "Не удалось загрузить список героев.", variant: "destructive" });
        } finally {
            setIsCharacterLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && user && user.email === 'admin@admin.com') {
            loadCharacters();
        }
    }, [user, loading]);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            const result = await seedDatabase();
            if(result.success) {
                toast({
                    title: "База данных успешно наполнена",
                    description: result.message,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
             toast({
                title: "Ошибка",
                description: error.message || "Не удалось наполнить базу данных.",
                variant: "destructive",
            });
        } finally {
            setIsSeeding(false);
        }
    }

    const handleJsonSeed = async () => {
        const collectionName = activeTab;
        const jsonContent = jsonContents[collectionName as keyof typeof jsonContents];

        if (!jsonContent) {
            toast({
                title: "Нет данных",
                description: "Пожалуйста, вставьте JSON в текстовое поле.",
                variant: "destructive",
            });
            return;
        }

        setIsJsonSeeding(true);
        try {
            const result = await seedFromJson(collectionName, jsonContent);
            if(result.success) {
                toast({
                    title: "База данных успешно обновлена",
                    description: result.message,
                });
                setJsonContents(prev => ({...prev, [collectionName]: ''}));
            } else {
                throw new Error(result.error || "Неизвестная ошибка");
            }
        } catch (error: any) {
             toast({
                title: "Ошибка",
                description: error.message || `Не удалось обновить базу данных из JSON.`,
                variant: "destructive",
            });
        } finally {
            setIsJsonSeeding(false);
        }
    };

    const handleJsonChange = (value: string, tab: string) => {
        setJsonContents(prev => ({
            ...prev,
            [tab]: value,
        }));
    };

    const handleFixCharacter = async () => {
        if (!user) {
            toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
            return;
        }
        
        setIsFixing(true);
        try {
            const result = await fixCharacterState(user.userId);
            if (result.success) {
                toast({
                    title: "Состояние героя исправлено",
                    description: result.message,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: "Ошибка",
                description: error.message || "Не удалось исправить состояние героя.",
                variant: "destructive",
            });
        } finally {
            setIsFixing(false);
        }
    };

     const handleDeleteCharacter = async (characterId: string, characterName: string) => {
        setIsDeleting(true);
        const result = await deleteCharacter(characterId);
        if (result.success) {
            toast({ title: "Герой удален", description: `Герой ${characterName} был успешно удален.` });
            await loadCharacters();
        } else {
            toast({ title: "Ошибка удаления", description: result.error || "Не удалось удалить героя.", variant: "destructive" });
        }
        setIsDeleting(false);
    };

    const isAnyActionInProgress = isSeeding || isJsonSeeding || isFixing || isDeleting || isCharacterLoading;


    if (loading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка...</div>;
    }

    if (!user || !user.isAdmin) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Доступ запрещен</CardTitle>
                        <CardDescription>У вас нет прав для доступа к этой странице.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Вернуться на дашборд</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full font-body p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-headline text-primary">Панель администратора</h1>
                <p className="text-muted-foreground">Инструменты для управления игровым миром.</p>
            </header>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Менеджер данных</CardTitle>
                        <CardDescription>CRUD по локациям, предметам, NPC и врагам.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/admin/data">Открыть менеджер данных</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Симулятор</CardTitle>
                        <CardDescription>Запуск одиночного тика и пакетной симуляции N тиков.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/admin/ai/simulator">Открыть симулятор</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Исправить состояние героя</CardTitle>
                        <CardDescription>Сбросить статус героя, переместить в Вайтран с полным здоровьем.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button onClick={handleFixCharacter} disabled={isAnyActionInProgress || !user}>
                            {isFixing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Исправить состояние
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Управление героями</CardTitle>
                        <CardDescription>Просмотр и удаление всех героев в базе данных.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isCharacterLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : characters.length === 0 ? (
                            <p className="text-muted-foreground py-4">Героев не найдено.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Имя</TableHead>
                                        <TableHead>Уровень</TableHead>
                                        <TableHead>Последнее обновление</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {characters.map((char) => (
                                        <TableRow key={char.id}>
                                            <TableCell className="font-medium">{char.name}</TableCell>
                                            <TableCell>{char.level}</TableCell>
                                            <TableCell>{new Date(char.lastUpdatedAt).toLocaleString('ru-RU')}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Удалить
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Это действие нельзя отменить. Герой <strong>{char.name}</strong> и вся его летопись будут безвозвратно удалены.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteCharacter(char.id, char.name)}>
                                                                Удалить
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Наполнение базы данных
                        </CardTitle>
                        <CardDescription>Данные игры загружаются из статических файлов. База данных не требует наполнения.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button onClick={handleSeed} disabled={isAnyActionInProgress}>
                            {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Наполнить базу данных
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Загрузка из JSON (не используется)</CardTitle>
                        <CardDescription>Данные игры загружаются из статических файлов в src/data/.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-7 w-full">
                                <TabsTrigger value="items">Предметы</TabsTrigger>
                                <TabsTrigger value="enemies">Враги</TabsTrigger>
                                <TabsTrigger value="quests">Задания</TabsTrigger>
                                <TabsTrigger value="sovngardeQuests">Совнгард</TabsTrigger>
                                <TabsTrigger value="npcs">NPC</TabsTrigger>
                                <TabsTrigger value="events">События</TabsTrigger>
                                <TabsTrigger value="cityEvents">Город</TabsTrigger>
                            </TabsList>
                            {['items', 'enemies', 'quests', 'sovngardeQuests', 'npcs', 'events', 'cityEvents'].map((tab) => (
                                <TabsContent key={tab} value={tab} className="space-y-4">
                                    <Textarea
                                        placeholder={`Вставьте JSON для ${tab}...`}
                                        value={jsonContents[tab as keyof typeof jsonContents]}
                                        onChange={(e) => handleJsonChange(e.target.value, tab)}
                                        className="min-h-[200px] font-mono text-xs"
                                        disabled={isAnyActionInProgress}
                                    />
                                    <Button onClick={handleJsonSeed} disabled={isAnyActionInProgress}>
                                        {isJsonSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Загрузить {tab}
                                    </Button>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
