
import type { FactionInfo } from "@/types/faction";

export const allFactions: FactionInfo[] = [
    { 
        id: "companions", 
        name: "Соратники", 
        description: "Почтенный орден воинов, базирующийся в Вайтране. Их ценности - честь, доблесть и взаимовыручка.",
        reputationTiers: [
            { level: 0, title: "Чужак", rewards: [] },
            { level: 50, title: "Знакомый", rewards: [
                { type: 'title', id: 'title_familiar', name: "Доступ к Йоррваскру", description: "Вам разрешено входить в жилые помещения Йоррваскра.", icon: 'Home' }
            ]},
            { level: 150, title: "Соратник", rewards: [
                { type: 'item', id: 'weapon_skyforge_sword', name: "Небесный стальной меч", description: "Право выковать личный меч в Небесной кузнице.", icon: 'Sword' }
            ]},
            { level: 300, title: "Член Круга", rewards: [
                { type: 'perk', id: 'perk_companions_valor', name: "Перк: Доблесть Соратника", description: "Когда здоровье падает ниже 50%, вы наносите на 10% больше урона.", icon: 'HeartHandshake' }
            ]},
            { level: 500, title: "Предвестник", rewards: [
                 { type: 'title', id: 'title_harbinger', name: "Титул Предвестника", description: "Ваше имя будут помнить веками.", icon: 'Crown' }
            ]},
        ],
        passiveBonuses: [
            { type: 'discount', name: 'Скидка кузнецов', description: 'Скидка 10% на все услуги кузнецов Скайрима', value: 10, requiredRank: 50 },
            { type: 'ability', name: 'Боевой клич', description: 'Способность вдохновлять союзников в бою (+5% урона спутникам)', requiredRank: 150 },
            { type: 'access', name: 'Небесная кузница', description: 'Доступ к легендарной Небесной кузнице для создания уникального оружия', requiredRank: 150 },
        ],
        shopItems: [
            { itemId: 'weapon_steel_sword', requiredRank: 0, priceModifier: 0.9 },
            { itemId: 'armor_steel_helmet', requiredRank: 50, priceModifier: 0.85 },
            { itemId: 'weapon_skyforge_sword', requiredRank: 150, priceModifier: 1.0 },
        ],
    },
    { 
        id: "college_of_winterhold", 
        name: "Коллегия Винтерхолда", 
        description: "Уединенное заведение для изучения магии, открытое для всех, кто ищет знания.",
        reputationTiers: [
            { level: 0, title: "Посторонний", rewards: [] },
            { level: 50, title: "Ученик", rewards: [
                { type: 'item', id: 'tome_oakflesh', name: "Том: Дубовая плоть", description: "Доступ к базовым защитным заклинаниям.", icon: 'Book' }
            ]},
            { level: 150, title: "Адепт", rewards: [
                { type: 'item', id: 'tome_fireball', name: "Том: Огненный шар", description: "Доступ к мощным атакующим заклинаниям.", icon: 'FlameKindling' }
            ]},
            { level: 300, title: "Мастер", rewards: [
                { type: 'perk', id: 'perk_mages_attunement', name: "Перк: Магическая гармония", description: "Все заклинания тратят на 10% меньше магии.", icon: 'BrainCircuit' }
            ]},
            { level: 500, title: "Архимаг", rewards: [
                { type: 'title', id: 'title_archmage', name: "Титул Архимага", description: "Вы становитесь главой Коллегии.", icon: 'GraduationCap' }
            ]},
        ],
        passiveBonuses: [
            { type: 'discount', name: 'Скидка на заклинания', description: 'Скидка 15% на все томы заклинаний в Коллегии', value: 15, requiredRank: 50 },
            { type: 'ability', name: 'Магическая регенерация', description: 'Магия восстанавливается на 10% быстрее', requiredRank: 150 },
            { type: 'access', name: 'Аркане', description: 'Доступ к запретной библиотеке Аркане с редкими заклинаниями', requiredRank: 300 },
        ],
        shopItems: [
            { itemId: 'potion_mana_minor', requiredRank: 0, priceModifier: 0.8 },
            { itemId: 'tome_oakflesh', requiredRank: 50, priceModifier: 0.7 },
            { itemId: 'tome_fireball', requiredRank: 150, priceModifier: 0.75 },
        ],
    },
    { 
        id: "thieves_guild", 
        name: "Гильдия воров", 
        description: "Секретная организация воров и контрабандистов, действующих из канализации Рифтена.",
        joinRestrictions: ['noble', 'companion'],
        reputationTiers: [
            { level: 0, title: "Аутсайдер", rewards: [] },
            { level: 50, title: "Карманник", rewards: [
                { type: 'item', id: 'armor_thieves_hood', name: "Капюшон Гильдии Воров", description: "Фирменный капюшон, который помогает оставаться в тени.", icon: 'Users' }
            ]},
            { level: 150, title: "Взломщик", rewards: [
                { type: 'item', id: 'misc_lockpicks', name: "Набор отмычек", description: "Запас отмычек для самых сложных замков.", icon: 'Key' }
            ]},
            { level: 300, title: "Ночной вор", rewards: [
                { type: 'perk', id: 'perk_thieves_shadow', name: "Перк: Покров тени", description: "Увеличивает шанс успешного побега из боя.", icon: 'Footprints' }
            ]},
            { level: 500, title: "Мастер Гильдии", rewards: [
                 { type: 'title', id: 'title_guildmaster', name: "Титул Мастера Гильдии", description: "Вся теневая сеть Рифтена в вашем распоряжении.", icon: 'KeyRound' }
            ]},
        ],
        passiveBonuses: [
            { type: 'discount', name: 'Черный рынок', description: 'Скидка 20% на все услуги ограды и контрабандистов', value: 20, requiredRank: 50 },
            { type: 'ability', name: 'Незаметность', description: 'Шанс избежать обнаружения при кражах увеличен на 15%', requiredRank: 150 },
            { type: 'access', name: 'Теневая сеть', description: 'Доступ к сети информаторов по всему Скайриму для получения редких заданий', requiredRank: 300 },
        ],
        shopItems: [
            { itemId: 'misc_lockpicks', requiredRank: 0, priceModifier: 0.5 },
            { itemId: 'armor_thieves_hood', requiredRank: 50, priceModifier: 0.7 },
            { itemId: 'potion_invisibility', requiredRank: 150, priceModifier: 0.8 },
        ],
    },
    { 
        id: "dark_brotherhood", 
        name: "Темное Братство", 
        description: "Смертоносный культ ассасинов, поклоняющихся Матери Ночи и Ситису.",
        joinRestrictions: ['companion'],
        reputationTiers: [
            { level: 0, title: "Незнакомец", rewards: [] },
            { level: 50, title: "Посвященный", rewards: [
                { type: 'item', id: 'item_poison_deadly', name: "Смертельный яд", description: "Мощный яд для бесшумного устранения целей.", icon: 'FlaskConical' }
            ]},
            { level: 150, title: "Ассасин", rewards: [
                { type: 'item', id: 'weapon_dagger_elven', name: "Эльфийский кинжал", description: "Тихое и смертоносное оружие для профессионала.", icon: 'Sword' }
            ]},
            { level: 300, title: "Душитель", rewards: [
                 { type: 'title', id: 'title_silencer', name: "Титул Душителя", description: "Ваше имя шепчут с ужасом во всех уголках Тамриэля.", icon: 'MicOff' }
            ]},
            { level: 500, title: "Слышащий", rewards: [
                { type: 'title', id: 'title_listener', name: "Титул Слышащего", description: "Вы - единственный, кто слышит голос Матери Ночи.", icon: 'Ear' }
            ]},
        ],
        passiveBonuses: [
            { type: 'discount', name: 'Контракты убийц', description: 'Получение дополнительной награды за выполнение контрактов (+25% золота)', value: 25, requiredRank: 50 },
            { type: 'ability', name: 'Смертельный удар', description: 'Критический урон кинжалами увеличен на 15%', requiredRank: 150 },
            { type: 'access', name: 'Святилище', description: 'Доступ к Темному Святилищу с уникальными заданиями и оборудованием', requiredRank: 150 },
        ],
        shopItems: [
            { itemId: 'item_poison_deadly', requiredRank: 50, priceModifier: 0.6 },
            { itemId: 'weapon_dagger_elven', requiredRank: 150, priceModifier: 0.75 },
            { itemId: 'armor_shrouded_hood', requiredRank: 300, priceModifier: 0.8 },
        ],
    },
];
