"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, 
  PlayCircle, 
  RefreshCw, 
  MapPin, 
  Heart,
  Zap,
  AlertTriangle
} from "lucide-react";
import {
  fixCharacterState,
  testAITick,
  resetCharacterToWhiterun,
  healCharacter,
  addGoldToCharacter,
  clearCharacterCombat,
  type TestResult
} from "./actions";

export default function TestUtilsPage() {
  const { user, loading } = useAuth(true);
  const { toast } = useToast();
  
  const [isTesting, setIsTesting] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const [goldAmount, setGoldAmount] = useState("1000");

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl font-body">Загрузка...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 font-body">
        <Card className="w-full max-w-md font-body">
          <CardHeader className="font-body">
            <CardTitle className="font-headline text-2xl">Доступ запрещён</CardTitle>
            <CardDescription className="font-body">У вас нет прав для доступа к этой странице.</CardDescription>
          </CardHeader>
          <CardContent className="font-body">
            <Button asChild className="w-full font-body">
              <Link href="/dashboard">Вернуться на дашборд</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTestAction = async (action: () => Promise<TestResult>, actionName: string) => {
    setIsTesting(true);
    try {
      const result = await action();
      if (result.success) {
        toast({
          title: "Успех",
          description: result.message,
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.error || `Не удалось выполнить ${actionName}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || `Не удалось выполнить ${actionName}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-8">
      <header className="font-body">
        <h1 className="text-4xl font-headline text-primary flex items-center gap-2">
          <Zap className="h-10 w-10" />
          Test Utils
        </h1>
        <p className="text-lg text-muted-foreground mt-2 font-body">Полезные инструменты для тестирования и отладки</p>
      </header>

      <Alert className="font-body">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Внимание</AlertTitle>
        <AlertDescription>
          Эти инструменты предназначены для тестирования и отладки. Используйте с осторожностью, так как они могут изменять данные в базе.
        </AlertDescription>
      </Alert>

      {/* Character ID Input */}
      <Card className="font-body">
        <CardHeader className="font-body">
          <CardTitle className="font-headline">ID персонажа для тестирования</CardTitle>
          <CardDescription className="font-body">Укажите ID персонажа (оставьте пустым для текущего пользователя)</CardDescription>
        </CardHeader>
        <CardContent className="font-body">
          <div className="space-y-2 font-body">
            <Label htmlFor="characterId" className="font-body">Character ID</Label>
            <Input
              id="characterId"
              placeholder={user.userId}
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="font-body"
            />
            <p className="text-sm text-muted-foreground font-body">
              Текущий пользователь: {user.email} (ID: {user.userId})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Character Management */}
      <div className="grid gap-6 md:grid-cols-2 font-body">
        <Card className="font-body">
          <CardHeader className="font-body">
            <CardTitle className="flex items-center gap-2 font-headline">
              <MapPin className="h-5 w-5" />
              Телепорт в Вайтран
            </CardTitle>
            <CardDescription className="font-body">Переместить героя в Вайтран с полным здоровьем</CardDescription>
          </CardHeader>
          <CardContent className="font-body">
            <Button 
              onClick={() => handleTestAction(
                () => resetCharacterToWhiterun(characterId || user.userId),
                "телепорт в Вайтран"
              )}
              disabled={isTesting}
              className="w-full"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Телепортировать
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Восстановить здоровье
            </CardTitle>
            <CardDescription>Восстановить HP героя до максимума</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestAction(
                () => healCharacter(characterId || user.userId),
                "восстановление здоровья"
              )}
              disabled={isTesting}
              className="w-full"
              variant="outline"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Вылечить
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Сбросить состояние
            </CardTitle>
            <CardDescription>Полностью сбросить состояние героя (бой, смерть, эффекты)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestAction(
                () => fixCharacterState(characterId || user.userId),
                "сброс состояния"
              )}
              disabled={isTesting}
              className="w-full"
              variant="destructive"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сбросить
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Очистить бой
            </CardTitle>
            <CardDescription>Удалить текущий бой и установить статус idle</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestAction(
                () => clearCharacterCombat(characterId || user.userId),
                "очистка боя"
              )}
              disabled={isTesting}
              className="w-full"
              variant="outline"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Очистить бой
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Gold */}
      <Card className="font-body">
        <CardHeader className="font-body">
          <CardTitle className="font-headline">Добавить золото</CardTitle>
          <CardDescription className="font-body">Добавить указанное количество золота персонажу</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 font-body">
          <div className="space-y-2 font-body">
            <Label htmlFor="goldAmount" className="font-body">Количество золота</Label>
            <Input
              id="goldAmount"
              type="number"
              placeholder="1000"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              className="font-body"
            />
          </div>
          <Button 
            onClick={() => handleTestAction(
              () => addGoldToCharacter(characterId || user.userId, parseInt(goldAmount) || 1000),
              "добавление золота"
            )}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Добавить золото
          </Button>
        </CardContent>
      </Card>

      {/* AI Testing */}
      <Card className="font-body">
        <CardHeader className="font-body">
          <CardTitle className="flex items-center gap-2 font-headline">
            <PlayCircle className="h-5 w-5" />
            Тест AI тика
          </CardTitle>
          <CardDescription className="font-body">Запустить один тик AI для персонажа</CardDescription>
        </CardHeader>
        <CardContent className="font-body">
          <Button 
            onClick={() => handleTestAction(
              () => testAITick(characterId || user.userId),
              "AI тик"
            )}
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Запустить AI тик
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
