
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DragonIcon } from "@/components/icons";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Star } from "lucide-react";
import type { Character } from "@/types/character";
import { createCharacter } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { allDivinities, type DivinityId } from "@/data/divinities";
import * as LucideIcons from "lucide-react";

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};


const races = [
  { id: 'nord', name: 'Норд', description: 'Родом из холодных земель Скайрима, норды известны своей устойчивостью к холоду и свирепой воинской культурой.', image: '/images/races/nord.png', hint: 'viking warrior' },
  { id: 'dunmer', name: 'Данмер (Тёмный эльф)', description: 'Также известные как тёмные эльфы, они родом из Морровинда. Известны своим сбалансированным владением магией и боем.', image: '/images/races/danmer.png', hint: 'dark elf' },
  { id: 'altmer', name: 'Альтмер (Высокий эльф)', description: 'Высокие эльфы с островов Саммерсет одарены в тайных искусствах и обладают природным сродством к магии.', image: '/images/races/altmer.png', hint: 'high elf' },
  { id: 'bosmer', name: 'Босмер (Лесной эльф)', description: 'Лесные эльфы Валенвуда - искусные лучники и мастера скрытности, живущие в гармонии с природой.', image: '/images/races/bosmer.png', hint: 'wood elf' },
  { id: 'khajiit', name: 'Каджит', description: 'Этот кошачий народ из Эльсвейра ловок, хитер и является отличными торговцами и ворами.', image: '/images/races/khajiit.png', hint: 'cat person' },
  { id: 'argonian', name: 'Аргонианин', description: 'Рептилоидная раса из Чернотопья, аргониане выносливы, могут дышать под водой и устойчивы к болезням.', image: '/images/races/argonian.png', hint: 'lizard person' },
];

const backstories = [
  { value: 'noble', label: 'Отпрыск благородного дома', description: 'Начинает в Солитьюде в дорогой одежде и с дополнительным золотом.' },
  { value: 'thief', label: 'Уличный беспризорник', description: 'Начинает в Рифтене с отмычками и кинжалом.' },
  { value: 'scholar', label: 'Ученик Коллегии', description: 'Начинает в Винтерхолде с робой новичка и томом заклинаний.' },
  { value: 'warrior', label: 'Ветеран Великой войны', description: 'Начинает около Вайтрана в поношенной броне и со стальным мечом.' },
  { value: 'shipwrecked', label: 'Потерпевший кораблекрушение', description: 'Начинает на ледяном берегу около Данстара в простой одежде.' },
  { value: 'left_for_dead', label: 'Оставленный умирать', description: 'Начинает в глуши со слабым здоровьем и в обрывках одежды.' },
  { value: 'companion', label: 'Новобранец Соратников', description: 'Начинает в Вайтране в тяжелой броне и с боевым топором.' },
  { value: 'escaped_prisoner', label: 'Сбежавший заключенный', description: 'Начинает в глуши в тюремных лохмотьях с навыками скрытности.' },
  { value: 'mercenary', label: 'Наемник', description: 'Начинает в Рифтене с базовым оружием и броней, сбалансированные боевые навыки.' },
  { value: 'pilgrim', label: 'Паломник', description: 'Начинает в случайном столичном городе в простых одеждах с божественным благословением.' },
];

export default function CharacterCreationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState({
    name: "",
    gender: "",
    race: "",
    backstory: "",
    patronDeity: "" as DivinityId,
  });
  const [isCreating, setIsCreating] = useState(false);
  const { user, loading: isAuthLoading } = useAuth(true);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCreate = async () => {
    if (!user) {
        toast({ title: "Ошибка", description: "Вы не авторизованы.", variant: "destructive" });
        return;
    }
    if (!character.name || !character.gender || !character.race || !character.backstory || !character.patronDeity) {
        toast({
            title: "Ошибка создания",
            description: "Пожалуйста, заполните все поля перед созданием героя.",
            variant: "destructive",
        });
        return;
    }

    setIsCreating(true);

    const now = Date.now();
    let initialCharacter: Character = {
      id: user.userId,
      name: character.name,
      gender: character.gender,
      race: character.race,
      backstory: character.backstory,
      patronDeity: character.patronDeity,
      level: 1,
      xp: { current: 0, required: 100 },
      stats: {
        health: { current: 100, max: 100 },
        magicka: { current: 100, max: 100 },
        stamina: { current: 100, max: 100 },
        fatigue: { current: 0, max: 100 },
      },
      attributes: { strength: 10, agility: 10, intelligence: 10, endurance: 10 },
      skills: { oneHanded: 15, block: 15, heavyArmor: 15, lightArmor: 15, persuasion: 15, alchemy: 15 },
      points: { attribute: 0, skill: 0 },
      location: 'whiterun',
      inventory: [{ id: 'gold', name: 'Золото', weight: 0, quantity: 50, type: 'gold' }],
      equippedItems: {},
      factions: {},
      status: 'idle',
      combat: null,
      sleepUntil: null,
      respawnAt: null,
      deathOccurredAt: null,
      activeSovngardeQuest: null,
      createdAt: now,
      lastUpdatedAt: now,
      deaths: 0,
      effects: [],
      knownSpells: [],
      completedQuests: [],
      currentAction: null,
      interventionPower: { current: 100, max: 100 },
      divineSuggestion: null,
      divineDestinationId: null,
      pendingTravel: null,
      season: 'Summer',
      weather: 'Clear',
      timeOfDay: 'day',
      actionCooldowns: {},
      activeCryptQuest: null,
      visitedLocations: [],
      gameDate: now,
      mood: 50,
      unlockedPerks: [],
      preferences: { autoAssignPoints: true, autoEquip: true },
      analytics: {
        killedEnemies: {},
        diceRolls: { d20: Array(21).fill(0) },
        encounteredEnemies: [],
        epicPhrases: [],
      },
      divineFavor: 0,
      templeProgress: 0,
      relationships: {},
      actionHistory: [],
    };

    // All character initialization logic is now handled server-side in the action
    try {
        const result = await createCharacter(user.userId, initialCharacter);
        if (result.success) {
            toast({
                title: "Герой создан!",
                description: result.welcomeMessage || "Ваше приключение в Скайриме начинается.",
                duration: 8000,
            });
            router.push("/dashboard");
        } else {
            throw new Error(result.error || "Failed to create character");
        }
    } catch (error) {
        console.error("Failed to create character:", error);
        toast({
            title: "Ошибка",
            description: "Не удалось сохранить героя. Пожалуйста, попробуйте снова.",
            variant: "destructive",
        });
    } finally {
        setIsCreating(false);
    }
  };

  const progressValue = (step / 4) * 100;
  
  if (isAuthLoading) {
      return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Проверка аутентификации...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
       <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Назад ко входу</Link>
        </Button>
      </div>
      <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <DragonIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-4xl font-headline">Создайте своего героя</CardTitle>
          </div>
          <CardDescription className="font-body">
            Создайте легенду, о которой будут слагать песни по всему Тамриэлю.
          </CardDescription>
          <Progress value={progressValue} className="w-full mt-4" />
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-0 zoom-in-95">
              <div className="space-y-4">
                <h3 className="text-2xl font-headline text-primary">Личность</h3>
                <p className="text-muted-foreground">
                  Кто вы? У каждой легенды есть имя.
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-lg font-semibold font-body">Имя персонажа</Label>
                  <Input
                    id="name"
                    value={character.name}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                    placeholder="например, Лидия, Драконорожденная"
                    className="mt-2 text-base"
                  />
                </div>
                <div>
                  <Label className="text-lg font-semibold font-body">Пол</Label>
                  <RadioGroup
                    value={character.gender}
                    onValueChange={(value) => setCharacter({ ...character, gender: value })}
                    className="mt-2 grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="male" id="male" className="peer sr-only" />
                      <Label htmlFor="male" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Мужской
                      </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="female" id="female" className="peer sr-only" />
                      <Label htmlFor="female" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Женский
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
             <div className="space-y-4 animate-in fade-in-0 zoom-in-95">
               <h3 className="text-2xl font-headline text-primary text-center">Выберите вашу расу</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {races.map((race) => (
                   <Card 
                     key={race.id}
                     onClick={() => setCharacter({ ...character, race: race.id })}
                     className={cn("cursor-pointer transition-all hover:shadow-primary/50 hover:shadow-lg", character.race === race.id && "border-primary ring-2 ring-primary")}
                   >
                     <CardHeader className="p-0">
                       <Image src={race.image} data-ai-hint={race.hint} alt={race.name} width={400} height={300} className="rounded-t-lg object-cover" />
                     </CardHeader>
                     <CardContent className="p-4">
                       <h4 className="font-headline text-lg">{race.name}</h4>
                       <p className="text-sm text-muted-foreground mt-1">{race.description}</p>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             </div>
          )}
          {step === 3 && (
            <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-0 zoom-in-95">
              <div className="space-y-4">
                <h3 className="text-2xl font-headline text-primary">Происхождение</h3>
                <p className="text-muted-foreground">
                  Ваше прошлое определяет ваше настоящее. Где начинается ваша история?
                </p>
                 <Image src="https://placehold.co/600x800.png" data-ai-hint="old map" alt="A depiction of a character's past" width={600} height={800} className="rounded-lg object-cover" />
              </div>
              <div className="space-y-6 flex flex-col justify-center">
                 <div>
                  <Label htmlFor="backstory" className="text-lg font-semibold font-body">Выберите вашу предысторию</Label>
                   <Select
                    value={character.backstory}
                    onValueChange={(value) => setCharacter({ ...character, backstory: value })}
                  >
                    <SelectTrigger id="backstory" className="mt-2 text-base">
                      <SelectValue placeholder="Выберите предысторию" />
                    </SelectTrigger>
                    <SelectContent>
                      {backstories.map((story) => (
                        <SelectItem key={story.value} value={story.value}>
                          <div className="flex flex-col py-1">
                            <span className="font-semibold">{story.label}</span>
                            <span className="text-xs text-muted-foreground">{story.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="animate-in fade-in-0 zoom-in-95">
                <h3 className="text-2xl font-headline text-primary text-center">Божественное покровительство</h3>
                <p className="text-muted-foreground text-center mb-4">Выберите божество, которое будет направлять вас на вашем пути.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allDivinities.map((divinity) => (
                        <Card 
                            key={divinity.id}
                            onClick={() => setCharacter({ ...character, patronDeity: divinity.id })}
                            className={cn("cursor-pointer transition-all hover:shadow-primary/50 hover:shadow-lg", character.patronDeity === divinity.id && "border-primary ring-2 ring-primary")}
                        >
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Icon name={divinity.icon} className="h-8 w-8 text-primary" />
                                    <CardTitle className="font-headline text-xl">{divinity.name}</CardTitle>
                                </div>
                                <CardDescription className="text-sm">{divinity.domain}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{divinity.description}</p>
                                <p className="text-xs mt-2 pt-2 border-t font-semibold">Пассивный эффект: <span className="font-normal">{divinity.passiveEffect.description}</span></p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isCreating}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Назад
            </Button>
          ) : <div></div>}
          {step < 4 ? (
            <Button onClick={handleNext} disabled={ (step === 1 && (!character.name || !character.gender)) || (step === 2 && !character.race) || (step === 3 && !character.backstory) }>
              Далее <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={!character.patronDeity || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Выковать свою судьбу"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
