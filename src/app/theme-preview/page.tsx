"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Sparkles, 
  BookOpen, 
  Smile, 
  Cloud, 
  BrainCircuit,
  Zap,
  CloudRain,
  HandHelping,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import { DragonIcon } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ThemePreviewPage() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Mock данные для демонстрации
  const mockCharacter = {
    name: "Торгрим Буревестник",
    level: 15,
    race: "Норд",
    location: "Вайтран",
    mood: 75,
    status: "Бездействует",
    interventionPower: { current: 80, max: 100 },
    templeProgress: 450000,
    divineFavor: 45,
    stats: {
      health: { current: 180, max: 200 },
      magicka: { current: 100, max: 120 },
      stamina: { current: 150, max: 180 },
    }
  };

  const mockAdventureLog = [
    { time: "14:32:15", icon: <BrainCircuit className="h-4 w-4" />, text: "Торгрим размышляет о Соратниках. Они понимают, что такое честь и доблесть." },
    { time: "14:31:48", icon: <Cloud className="h-4 w-4" />, text: "Погода изменилась: небо затянуло облаками." },
    { time: "14:31:20", icon: null, text: "После долгого пути, Торгрим наконец прибыл в Вайтран." },
    { time: "14:30:55", icon: <Sparkles className="h-4 w-4" />, text: "[божество] Боги услышали мольбы и даровали благословение." },
    { time: "14:30:22", icon: <BrainCircuit className="h-4 w-4" />, text: "Торгрим подумывает отметить этот день в таверне." },
  ];

  const themeStyles = isDarkTheme ? {
    // Dark Fantasy Theme - Синяя/Фиолетовая магическая тема
    wrapper: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen",
    card: "bg-slate-800/90 border-purple-500/30 shadow-lg shadow-purple-500/20 backdrop-blur-sm",
    cardHeader: "border-b border-purple-500/20",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    textAccent: "text-purple-300",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    buttonSecondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    progress: "bg-slate-700",
    progressBar: "bg-gradient-to-r from-purple-500 to-blue-500",
    separator: "bg-purple-500/20",
    scrollArea: "border border-purple-500/20",
    logEntry: "hover:bg-slate-700/50",
    avatar: "border-2 border-purple-500",
    icon: "text-purple-400",
    themeName: "🌙 Темная Магия",
  } : {
    // Light Nordic Theme (текущая)
    wrapper: "bg-slate-50 min-h-screen",
    card: "bg-white border-slate-200 shadow-sm",
    cardHeader: "border-b border-slate-200",
    text: "text-slate-900",
    textMuted: "text-slate-600",
    textAccent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    button: "bg-amber-500 hover:bg-amber-600 text-white",
    buttonSecondary: "bg-slate-200 hover:bg-slate-300 text-slate-900",
    progress: "bg-slate-200",
    progressBar: "bg-amber-500",
    separator: "bg-slate-200",
    scrollArea: "border border-slate-200",
    logEntry: "hover:bg-slate-50",
    avatar: "border-2 border-amber-500",
    icon: "text-amber-600",
    themeName: "☀️ Нордическое Золото",
  };

  return (
    <div className={themeStyles.wrapper}>
      {/* Header с переключателем тем */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className={themeStyles.buttonSecondary}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <DragonIcon className={`h-6 w-6 ${themeStyles.icon}`} />
                <h1 className={`text-xl font-bold font-headline ${themeStyles.text}`}>
                  Предпросмотр темы
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={themeStyles.badge}>
                {themeStyles.themeName}
              </Badge>
              <Button
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className={themeStyles.button}
              >
                {isDarkTheme ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Светлая
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Тёмная
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Left Column - Character Info */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Card className={themeStyles.card}>
              <CardHeader className={`flex flex-row items-center gap-4 ${themeStyles.cardHeader}`}>
                <Avatar className={`h-16 w-16 ${themeStyles.avatar}`}>
                  <AvatarFallback className={themeStyles.badge}>
                    {mockCharacter.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className={`font-headline text-2xl ${themeStyles.text}`}>
                    {mockCharacter.name}
                  </CardTitle>
                  <CardDescription className={themeStyles.textMuted}>
                    Уровень {mockCharacter.level} {mockCharacter.race}
                  </CardDescription>
                  <div className={`text-sm ${themeStyles.textMuted} mt-2 flex items-center gap-2`}>
                    <MapPin className="h-4 w-4"/>
                    <span>{mockCharacter.location}</span>
                  </div>
                  <div className={`text-sm ${themeStyles.textAccent} mt-1 flex items-center gap-2`}>
                    <Smile className="h-4 w-4"/>
                    <span>В хорошем настроении</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className={`text-sm text-center p-2 rounded-md ${themeStyles.badge}`}>
                  <span className="font-bold">{mockCharacter.status}</span>
                </p>

                {/* Stats */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className={`text-sm ${themeStyles.text}`}>Здоровье</Label>
                      <span className={`text-xs font-mono ${themeStyles.textMuted}`}>
                        {mockCharacter.stats.health.current} / {mockCharacter.stats.health.max}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${themeStyles.progress}`}>
                      <div 
                        className={`h-full ${themeStyles.progressBar} transition-all`}
                        style={{ width: `${(mockCharacter.stats.health.current / mockCharacter.stats.health.max) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className={`text-sm ${themeStyles.text}`}>Магия</Label>
                      <span className={`text-xs font-mono ${themeStyles.textMuted}`}>
                        {mockCharacter.stats.magicka.current} / {mockCharacter.stats.magicka.max}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${themeStyles.progress}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                        style={{ width: `${(mockCharacter.stats.magicka.current / mockCharacter.stats.magicka.max) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className={`text-sm ${themeStyles.text}`}>Выносливость</Label>
                      <span className={`text-xs font-mono ${themeStyles.textMuted}`}>
                        {mockCharacter.stats.stamina.current} / {mockCharacter.stats.stamina.max}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${themeStyles.progress}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                        style={{ width: `${(mockCharacter.stats.stamina.current / mockCharacter.stats.stamina.max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Separator className={themeStyles.separator} />

                {/* Temple Progress */}
                <div className="pt-4">
                  <Label className={`text-base font-semibold flex items-center gap-2 ${themeStyles.text}`}>
                    <Sparkles className={`h-5 w-5 ${themeStyles.icon}`} />
                    Храм Покровителя
                  </Label>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm ${themeStyles.text}`}>Прогресс</span>
                      <span className={`text-sm font-mono ${themeStyles.textMuted}`}>22.5%</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${themeStyles.progress}`}>
                      <div 
                        className={`h-full ${themeStyles.progressBar}`}
                        style={{ width: '22.5%' }}
                      />
                    </div>
                    <p className={`text-xs ${themeStyles.textMuted} text-center mt-2`}>
                      450,000 / 2,000,000 золота
                    </p>
                  </div>
                </div>

                <Separator className={themeStyles.separator} />

                {/* Divine Favor */}
                <div className="pt-4">
                  <Label className={`text-base font-semibold flex items-center gap-2 ${themeStyles.text}`}>
                    <HandHelping className={`h-5 w-5 ${themeStyles.icon}`} />
                    Божественное Благоволение
                  </Label>
                  <p className={`text-xs ${themeStyles.textMuted} mt-1`}>
                    Накопите 100 очков, чтобы получить благословение.
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm ${themeStyles.text}`}>Прогресс</span>
                      <span className={`text-sm font-mono ${themeStyles.textMuted}`}>45 / 100</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${themeStyles.progress}`}>
                      <div 
                        className={`h-full ${themeStyles.progressBar}`}
                        style={{ width: '45%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Adventure Log */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className={`${themeStyles.card} flex-1 flex flex-col`}>
              <CardHeader className={themeStyles.cardHeader}>
                <div className="flex items-center gap-2">
                  <BookOpen className={`h-6 w-6 ${themeStyles.icon}`} />
                  <CardTitle className={`font-headline ${themeStyles.text}`}>
                    Журнал приключений
                  </CardTitle>
                </div>
                <CardDescription className={themeStyles.textMuted}>
                  Хроника путешествий, мыслей и деяний вашего героя в новом стиле.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <ScrollArea className={`h-96 w-full flex-1 rounded-md ${themeStyles.scrollArea} p-2`}>
                  <div className="space-y-3 pr-4">
                    {mockAdventureLog.map((log, index) => (
                      <div key={index} className="space-y-2">
                        <div className={`flex items-start gap-2 p-2 rounded-md transition-colors ${themeStyles.logEntry}`}>
                          <span className={`font-mono ${themeStyles.textMuted} mt-0.5 text-xs`}>
                            [{log.time}]
                          </span>
                          {log.icon && (
                            <div className={`mt-0.5 ${themeStyles.icon}`}>{log.icon}</div>
                          )}
                          <p className={`text-sm ${themeStyles.text} flex-1`}>{log.text}</p>
                        </div>
                        {index < mockAdventureLog.length - 1 && (
                          <Separator className={themeStyles.separator} />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Theme Info Card */}
            <Card className={themeStyles.card}>
              <CardHeader className={themeStyles.cardHeader}>
                <CardTitle className={`font-headline ${themeStyles.text}`}>
                  Информация о теме
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className={`font-semibold mb-2 ${themeStyles.text}`}>
                      {isDarkTheme ? "🌙 Темная Магия" : "☀️ Нордическое Золото"}
                    </h3>
                    <p className={`text-sm ${themeStyles.textMuted}`}>
                      {isDarkTheme 
                        ? "Мистическая тёмная тема с фиолетовыми и синими оттенками. Идеально для магов и любителей ночных приключений."
                        : "Классическая светлая тема с золотыми акцентами. Вдохновлена нордической культурой Скайрима."
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${themeStyles.text}`}>Особенности:</h4>
                    <ul className={`text-sm ${themeStyles.textMuted} space-y-1 list-disc list-inside`}>
                      {isDarkTheme ? (
                        <>
                          <li>Градиентный фон slate-900 → purple-900</li>
                          <li>Полупрозрачные карточки с blur эффектом</li>
                          <li>Фиолетовые акценты и свечение</li>
                          <li>Градиентные прогресс-бары (purple→blue)</li>
                        </>
                      ) : (
                        <>
                          <li>Чистый белый фон карточек</li>
                          <li>Золотой акцент #F39C12</li>
                          <li>Чёткие границы и тени</li>
                          <li>Классическая типографика Cinzel</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Divine Intervention */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Card className={themeStyles.card}>
              <CardHeader className={themeStyles.cardHeader}>
                <CardTitle className={`font-headline text-lg flex items-center gap-2 ${themeStyles.text}`}>
                  <Zap className={`h-5 w-5 ${themeStyles.icon}`} />
                  Пульт Вмешательства
                </CardTitle>
                <CardDescription className={themeStyles.textMuted}>
                  Направляйте своего героя или просто наблюдайте.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label className={`font-semibold ${themeStyles.text}`}>Сила Вмешательства</Label>
                    <span className={`text-sm font-mono ${themeStyles.textMuted}`}>
                      {mockCharacter.interventionPower.current} / {mockCharacter.interventionPower.max}
                    </span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${themeStyles.progress}`}>
                    <div 
                      className={`h-full ${themeStyles.progressBar}`}
                      style={{ width: '80%' }}
                    />
                  </div>
                  <p className={`text-xs ${themeStyles.textMuted} mt-1`}>
                    Восстановление: ~2 ед./мин
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className={`font-semibold ${themeStyles.text}`}>Божественный шёпот</Label>
                  <Textarea
                    placeholder="Сообщение герою (до 200 символов)"
                    maxLength={200}
                    className={`${isDarkTheme ? 'bg-slate-700 border-purple-500/30 text-slate-100' : ''}`}
                  />
                  <Button className={`w-full ${themeStyles.button}`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Отправить сообщение (10 силы)
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button className={themeStyles.button}>
                    <Sparkles className="mr-2 h-4 w-4"/>
                    Благословить
                  </Button>
                  <Button className={`${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}>
                    <CloudRain className="mr-2 h-4 w-4"/>
                    Покарать
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Info */}
            <Card className={themeStyles.card}>
              <CardHeader className={themeStyles.cardHeader}>
                <CardTitle className={`text-sm font-semibold ${themeStyles.text}`}>
                  Сравнение тем
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className={`text-xs font-semibold ${themeStyles.textAccent} mb-1`}>
                      Текущая тема:
                    </h4>
                    <p className={`text-xs ${themeStyles.textMuted}`}>
                      {themeStyles.themeName}
                    </p>
                  </div>
                  
                  <Separator className={themeStyles.separator} />
                  
                  <div>
                    <h4 className={`text-xs font-semibold ${themeStyles.text} mb-2`}>Переключите тему:</h4>
                    <p className={`text-xs ${themeStyles.textMuted}`}>
                      Используйте кнопку в шапке для сравнения светлой и тёмной версий интерфейса.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Info Banner */}
        <div className="mt-8">
          <Card className={themeStyles.card}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h2 className={`text-2xl font-bold font-headline ${themeStyles.text}`}>
                  Это демонстрационная страница
                </h2>
                <p className={themeStyles.textMuted}>
                  Здесь вы можете сравнить две темы интерфейса и выбрать ту, которая вам больше нравится.
                  Используйте переключатель в шапке для смены между светлой и тёмной темой.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Link href="/">
                    <Button className={themeStyles.buttonSecondary}>
                      Вернуться к логину
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className={themeStyles.button}>
                      Перейти к игре
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

