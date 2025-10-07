
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
        ]
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
        ]
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
        ]
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
        ]
    },
];
