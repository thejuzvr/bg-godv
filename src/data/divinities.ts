
import type { Divinity, DivinityId } from '@/types/divinity';
import type { Character, ActiveEffect } from '@/types/character';

export { type DivinityId };

export const allDivinities: Divinity[] = [
    {
        id: 'akatosh',
        name: 'Акатош',
        domain: 'Бог-Дракон Времени, главный бог пантеона.',
        description: 'Акатош представляет качества выносливости, неуязвимости и вечной законности.',
        icon: 'Timer',
        passiveEffect: {
            description: 'Восстановление здоровья и запаса сил немного ускорено.',
            apply: (char: Character): Character => char
        },
        grace: {
            id: 'grace_akatosh',
            name: 'Милость Акатоша',
            description: 'Время течет быстрее для героя, ускоряя все действия на 15%.',
            apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_akatosh',
                    name: 'Милость Акатоша',
                    description: 'Все действия ускорены на 15%.',
                    icon: 'Timer',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_akatosh', name: 'Дитя Времени', description: 'Все действия постоянно ускорены на 5%.', icon: 'Timer' },
            artifact: { id: 'artifact_akatosh_hourglass', name: 'Песочные часы Акатоша', weight: 1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' }
        }
    },
    {
        id: 'arkay',
        name: 'Аркей',
        domain: 'Бог Цикла Жизни и Смерти.',
        description: 'Аркей следит за балансом жизни и смерти и является защитником душ от некромантии.',
        icon: 'Scale',
        passiveEffect: {
            description: '+10 к максимальному здоровью.',
            apply: (char: Character): Character => {
                char.stats.health.max += 10;
                return char;
            }
        },
        grace: {
            id: 'grace_arkay',
            name: 'Милость Аркея',
            description: 'Герой получает мощное сопротивление болезням и ядам.',
             apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_arkay',
                    name: 'Милость Аркея',
                    description: 'Высокое сопротивление болезням и ядам.',
                    icon: 'Scale',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_arkay', name: 'Страж Жизни', description: 'Постоянно увеличивает максимальное здоровье на 50 ед.', icon: 'Scale' },
            artifact: { id: 'artifact_arkay_ward', name: 'Оберег Аркея', weight: 1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' }
        }
    },
    {
        id: 'dibella',
        name: 'Дибелла',
        domain: 'Богиня Красоты и Любви.',
        description: 'Покровительница художников, поэтов и всех влюбленных. Вдохновляет на творчество.',
        icon: 'Heart',
        passiveEffect: {
            description: 'Навык Убеждения растет немного быстрее.',
            apply: (char: Character): Character => {
                char.skills.persuasion += 5; // Initial boost
                return char;
            }
        },
         grace: {
            id: 'grace_dibella',
            name: 'Милость Дибеллы',
            description: 'Настроение героя значительно улучшается и не падает ниже 70.',
            apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_dibella',
                    name: 'Милость Дибеллы',
                    description: 'Настроение не падает ниже 70.',
                    icon: 'Heart',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                char.mood = Math.max(70, char.mood);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_dibella', name: 'Сердце Дибеллы', description: 'Убеждение постоянно повышено, а настроение героя реже падает.', icon: 'Heart' },
            artifact: { id: 'artifact_dibella_brush', name: 'Кисть Дибеллы', weight: 0.5, type: 'weapon', rarity: 'legendary', damage: 5, equipmentSlot: 'weapon' }
        }
    },
    {
        id: 'julianos',
        name: 'Юлианос',
        domain: 'Бог Мудрости и Логики.',
        description: 'Покровитель магов, ученых и писцов. Ценит знание и разум.',
        icon: 'BrainCircuit',
        passiveEffect: {
            description: '+10 к максимальной магии.',
            apply: (char: Character): Character => {
                char.stats.magicka.max += 10;
                return char;
            }
        },
         grace: {
            id: 'grace_julianos',
            name: 'Милость Юлианоса',
            description: 'Все заклинания тратят на 20% меньше магии.',
            apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_julianos',
                    name: 'Милость Юлианоса',
                    description: 'Затраты магии снижены на 20%.',
                    icon: 'BrainCircuit',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_julianos', name: 'Разум Юлианоса', description: 'Постоянно увеличивает максимальный запас магии на 50 ед.', icon: 'BrainCircuit' },
            artifact: { id: 'artifact_julianos_tome', name: 'Фолиант Юлианоса', weight: 2, type: 'armor', rarity: 'legendary', armor: 2, equipmentSlot: 'ring' }
        }
    },
    {
        id: 'kynareth',
        name: 'Кинарет',
        domain: 'Богиня Воздуха, Ветров и Неба.',
        description: 'Покровительница путешественников и моряков. Дарует удачу в пути.',
        icon: 'Wind',
        passiveEffect: {
            description: '+10 к максимальному запасу сил.',
            apply: (char: Character): Character => {
                char.stats.stamina.max += 10;
                return char;
            }
        },
        grace: {
            id: 'grace_kynareth',
            name: 'Милость Кинарет',
            description: 'Скорость передвижения по карте увеличена, а расход выносливости в путешествии снижен.',
            apply: (char: Character): Character => {
                 const newEffect: ActiveEffect = {
                    id: 'grace_kynareth',
                    name: 'Милость Кинарет',
                    description: 'Путешествия проходят быстрее и тратят меньше сил.',
                    icon: 'Wind',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_kynareth', name: 'Дыхание Кинарет', description: 'Постоянно увеличивает максимальный запас сил на 50 ед.', icon: 'Wind' },
            artifact: { id: 'artifact_kynareth_feather', name: 'Перо Кинарет', weight: 0.1, type: 'armor', rarity: 'legendary', equipmentSlot: 'ring' }
        }
    },
    {
        id: 'mara',
        name: 'Мара',
        domain: 'Богиня Любви и Сострадания, Богиня-Мать.',
        description: 'Мара является покровительницей брака, семьи и гармонии в обществе.',
        icon: 'HandHeart',
        passiveEffect: {
            description: 'Зелья лечения восстанавливают на 10% больше здоровья.',
            apply: (char: Character): Character => char
        },
        grace: {
            id: 'grace_mara',
            name: 'Милость Мары',
            description: 'Эффективность всех лечебных заклинаний и зелий увеличена на 25%.',
            apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_mara',
                    name: 'Милость Мары',
                    description: 'Лечение на 25% эффективнее.',
                    icon: 'HandHeart',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_mara', name: 'Прикосновение Мары', description: 'Постоянно увеличивает эффективность лечебных зелий и заклинаний на 10%.', icon: 'HandHeart' },
            artifact: { id: 'artifact_mara_bond', name: 'Узы Мары', weight: 0.2, type: 'armor', rarity: 'legendary', equipmentSlot: 'ring' }
        }
    },
    {
        id: 'stendarr',
        name: 'Стендарр',
        domain: 'Бог Сострадания, Милосердия и Справедливости.',
        description: 'Стендарр вдохновляет на праведные дела и защиту слабых. Его последователи - паладины и целители.',
        icon: 'ShieldCheck',
        passiveEffect: {
            description: '+5% к эффективности блокирования.',
            apply: (char: Character): Character => {
                char.skills.block += 5;
                return char;
            }
        },
        grace: {
            id: 'grace_stendarr',
            name: 'Милость Стендарра',
            description: 'Класс брони героя увеличен на 25%.',
             apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_stendarr',
                    name: 'Милость Стендарра',
                    description: 'Класс брони увеличен на 25%.',
                    icon: 'ShieldCheck',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_stendarr', name: 'Бастион Стендарра', description: 'Постоянно увеличивает класс брони на 10%.', icon: 'ShieldCheck' },
            artifact: { id: 'artifact_stendarr_hammer', name: 'Молот Стендарра', weight: 18, type: 'weapon', rarity: 'legendary', damage: 25, equipmentSlot: 'weapon' }
        }
    },
    {
        id: 'talos',
        name: 'Талос',
        domain: 'Бог-Герой Человечества, Бог Могущества и Чести.',
        description: 'Талос, некогда смертный, достиг божественности и стал символом силы и амбиций человечества.',
        icon: 'Crown',
        passiveEffect: {
            description: '+5% к урону одноручным оружием.',
            apply: (char: Character): Character => {
                char.skills.oneHanded += 5;
                return char;
            }
        },
         grace: {
            id: 'grace_talos',
            name: 'Милость Талоса',
            description: 'Весь наносимый урон увеличен на 15%.',
            apply: (char: Character): Character => {
                 const newEffect: ActiveEffect = {
                    id: 'grace_talos',
                    name: 'Милость Талоса',
                    description: 'Урон увеличен на 15%.',
                    icon: 'Crown',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_talos', name: 'Дух Талоса', description: 'Постоянно увеличивает весь урон на 5%.', icon: 'Crown' },
            artifact: { id: 'artifact_talos_armor', name: 'Доспех Талоса', weight: 30, type: 'armor', rarity: 'legendary', armor: 40, equipmentSlot: 'torso' }
        }
    },
    {
        id: 'zenithar',
        name: 'Зенитар',
        domain: 'Бог Труда и Коммерции.',
        description: 'Покровитель торговцев, ремесленников и трудяг. Благословляет честный труд и выгодные сделки.',
        icon: 'Coins',
        passiveEffect: {
            description: 'Цены у торговцев всегда немного выгоднее.',
            apply: (char: Character): Character => char
        },
        grace: {
            id: 'grace_zenithar',
            name: 'Милость Зенитара',
            description: 'Герой находит на 20% больше золота.',
            apply: (char: Character): Character => {
                const newEffect: ActiveEffect = {
                    id: 'grace_zenithar',
                    name: 'Милость Зенитара',
                    description: 'Количество находимого золота увеличено на 20%.',
                    icon: 'Coins',
                    type: 'buff',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                };
                char.effects = char.effects.filter(e => !e.id.startsWith('grace_'));
                char.effects.push(newEffect);
                return char;
            }
        },
        finalReward: {
            permanentEffect: { id: 'perm_zenithar', name: 'Удача Зенитара', description: 'Герой постоянно находит на 10% больше золота.', icon: 'Coins' },
            artifact: { id: 'artifact_zenithar_coin', name: 'Монета Зенитара', weight: 0.1, type: 'armor', rarity: 'legendary', equipmentSlot: 'amulet' }
        }
    }
];
