
import type { Achievement } from "@/types/achievement";

export const allAchievements: Omit<Achievement, 'isUnlocked'>[] = [
    {
        id: 'first_quest',
        name: 'Начало пути',
        description: 'Выполнить первое задание.',
        icon: 'Scroll',
    },
    {
        id: 'level_10',
        name: 'Закаленный в боях',
        description: 'Достигнуть 10 уровня.',
        icon: 'Award',
    },
    {
        id: 'first_death',
        name: 'Не в этот раз',
        description: 'Впервые умереть и возродиться.',
        icon: 'Skull',
    },
    {
        id: 'explorer',
        name: 'Путешественник',
        description: 'Посетить все крупные города Скайрима.',
        icon: 'Map',
    },
    {
        id: 'rich_man',
        name: 'Богач',
        description: 'Накопить 10,000 золота.',
        icon: 'Coins',
    },
    {
        id: 'slayer',
        name: 'Убийца чудовищ',
        description: 'Победить 50 врагов.',
        icon: 'Sword',
    },
    { id: 'temple_akatosh', name: 'Храм Времени', description: 'Построить великий храм в честь Акатоша.', icon: 'Timer' },
    { id: 'temple_arkay', name: 'Храм Жизни и Смерти', description: 'Построить великий храм в честь Аркея.', icon: 'Scale' },
    { id: 'temple_dibella', name: 'Храм Красоты', description: 'Построить великий храм в честь Дибеллы.', icon: 'Heart' },
    { id: 'temple_julianos', name: 'Храм Мудрости', description: 'Построить великий храм в честь Юлианоса.', icon: 'BrainCircuit' },
    { id: 'temple_kynareth', name: 'Храм Ветров', description: 'Построить великий храм в честь Кинарет.', icon: 'Wind' },
    { id: 'temple_mara', name: 'Храм Любви', description: 'Построить великий храм в честь Мары.', icon: 'HandHeart' },
    { id: 'temple_stendarr', name: 'Храм Справедливости', description: 'Построить великий храм в честь Стендарра.', icon: 'ShieldCheck' },
    { id: 'temple_talos', name: 'Храм Героев', description: 'Построить великий храм в честь Талоса.', icon: 'Crown' },
    { id: 'temple_zenithar', name: 'Храм Труда', description: 'Построить великий храм в честь Зенитара.', icon: 'Coins' },
  // Theft/Jail themed
  { id: 'petty_thief', name: 'Мелкий воришка', description: 'Попасться на мелкой краже и испытать позор.', icon: 'HandCoins' },
  { id: 'jailbird', name: 'Постоялец тюремной камеры', description: 'Оказаться в тюрьме.', icon: 'Lock' },
];
