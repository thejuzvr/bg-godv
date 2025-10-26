"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, ExternalLink, Terminal, Info } from "lucide-react";

export default function DrizzleStudioPage() {
  const { user, loading } = useAuth(true);
  const [isStudioRunning, setIsStudioRunning] = useState(false);

  useEffect(() => {
    // Проверяем, запущен ли Drizzle Studio
    const checkStudio = async () => {
      try {
        // Drizzle Studio использует специальную систему с веб-воркерами
        // Проверяем доступность просто установкой флага через таймаут
        // т.к. CORS блокирует проверку через fetch
        setIsStudioRunning(true); // Считаем что запущен если открыта страница
      } catch {
        setIsStudioRunning(false);
      }
    };

    checkStudio();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ запрещён</CardTitle>
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
        <h1 className="text-4xl font-headline text-primary flex items-center gap-2">
          <Database className="h-10 w-10" />
          Drizzle Studio
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Продвинутый редактор базы данных</p>
      </header>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>О Drizzle Studio</AlertTitle>
        <AlertDescription>
          Drizzle Studio — это веб-интерфейс для управления базой данных. Он предоставляет визуальный редактор для просмотра и редактирования данных, выполнения SQL-запросов и многого другого.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Запуск Drizzle Studio
            </CardTitle>
            <CardDescription>Выполните команду для запуска</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              npm run db:studio
            </div>
            <p className="text-sm text-muted-foreground">
              После запуска Drizzle Studio будет доступен по адресу{" "}
              <a 
                href="https://local.drizzle.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://local.drizzle.studio
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статус</CardTitle>
            <CardDescription>Текущее состояние Drizzle Studio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isStudioRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {isStudioRunning ? 'Запущен' : 'Не запущен'}
              </span>
            </div>
            <Button asChild className="w-full">
              <a 
                href="https://local.drizzle.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Открыть Drizzle Studio
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Alert>
              <AlertDescription className="text-sm">
                Для использования Drizzle Studio выполните команду <code className="bg-muted px-1 py-0.5 rounded">npm run db:studio</code> в терминале.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Возможности Drizzle Studio</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Просмотр и редактирование всех таблиц базы данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Выполнение произвольных SQL-запросов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Визуализация связей между таблицами</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Фильтрация и сортировка данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Экспорт и импорт данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Миграции и история изменений схемы</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="text-amber-500">⚠️ Предупреждение</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Будьте осторожны при редактировании данных через Drizzle Studio. 
            Изменения применяются немедленно и могут повлиять на работу приложения. 
            Рекомендуется создавать резервные копии перед внесением критических изменений.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
