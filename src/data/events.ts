
import type { GameEvent } from "@/types/event";

export const initialEvents: GameEvent[] = [
    // Combat Events (снижены в 10 раз - события проверяются каждые 3 сек во время путешествия)
    {
        id: 'travel_ambush_wolf',
        type: 'combat',
        description: "На обочине дороги герой замечает стаю волков. Они выглядят голодными.",
        chance: 0.015,
        enemyId: 'wolf'
    },
    {
        id: 'travel_ambush_bandit',
        type: 'combat',
        description: "Из-за скалы выскакивает бандит с криком: 'Кошелек или жизнь!'",
        chance: 0.012,
        enemyId: 'bandit'
    },
    {
        id: 'travel_ambush_spider',
        type: 'combat',
        description: "С дерева на дорогу спускается огромный морозный паук.",
        chance: 0.010,
        seasons: ['Autumn', 'Winter'],
        enemyId: 'frost_spider'
    },
    {
        id: 'travel_ambush_mudcrab',
        type: 'combat',
        description: "Герой случайно наступает на камень, который оказывается очень сердитым грязекрабом.",
        chance: 0.018,
        enemyId: 'mudcrab'
    },
    {
  id: 'travel_ambush_bee_hive',
  type: 'combat',
  description: "Герой случайно задевает улей. Теперь его преследует рой разъярённых пчёл!",
  chance: 0.02,
  enemyId: 'bee_swarm' // можно использовать существующий enemy или условный — но ты сказал, врагов не добавлять, так что можно обойтись описанием и эффектом "укус"
    },
    {
  id: 'travel_narrative_bee_attack',
  type: 'narrative',
  description: "Герой случайно задевает улей и получает несколько укусов. Больно, но не смертельно. Зато теперь пахнет мёдом.",
  chance: 0.025
    },

// === Special / Meta Events ===
    {
  id: 'travel_meta_too_many_wolves',
  type: 'narrative',
  description: "Герой замечает третью стаю волков за сегодня. 'Неужели в Skyrim больше волков, чем людей?' — думает он вслух.",
  chance: 0.03
    },
    {
  id: 'travel_meta_inventory_full',
  type: 'narrative',
  description: "Герой пытается поднять старый башмак, но рюкзак уже лопается от 'полезного хлама'. 'Зачем я вообще это поднимаю?' — спрашивает он себя в сотый раз.",
  chance: 0.05
    },
    {
  id: 'travel_meta_door_physics',
  type: 'narrative',
  description: "Герой подходит к двери пещеры... и не может её открыть, потому что какой-то камень мешает. Он пинает его — и камень проходит сквозь землю. 'Ладно...'",
  chance: 0.02
    },
    {
  id: 'travel_meta_follower_stuck',
  type: 'narrative',
  description: "Герой вспоминает, как его последний спутник застрял в дверном проёме и кричал: 'Я иду!' — целых два дня. С тех пор он путешествует один.",
  chance: 0.025
    },
    {
  id: 'travel_meta_load_screen_thought',
  type: 'narrative',
  description: "На мгновение всё замирает. Герой чувствует странное дежавю... будто его только что 'загрузили'. Он трясёт головой и идёт дальше.",
  chance: 0.015
    },
    {
  id: 'travel_meta_sweet_roll_paradox',
  type: 'narrative',
  description: "Герой находит сладкий рулет. Но он же только что съел один? Или нет? В Skyrim время течёт странно... особенно вокруг рулетов.",
  chance: 0.04
    },
    {
  id: 'travel_meta_no_map_markers',
  type: 'narrative',
  description: "Герой пытается вспомнить, куда идти, но на 'карте' в голове всё размыто. 'Кто вообще придумал эти туманы на карте?' — ворчит он.",
  chance: 0.035
    },
    {
  id: 'travel_meta_bandit_dialogue',
  type: 'narrative',
  description: "Мимо проходит бандит, бормоча: 'Я не хочу с тобой драться...' Герой оглядывается. Тот пожимает плечами: 'Просто реплика такая. Начальство велело'.",
  chance: 0.02
    },
    {
  id: 'travel_meta_cooking_failure',
  type: 'narrative',
  description: "Герой пытается приготовить похлёбку у костра. Получается что-то между зельем и углём. 'Наверное, это... эликсир храбрости?'",
  chance: 0.045
    },
    {
  id: 'travel_meta_save_scumming_guilt',
  type: 'narrative',
  description: "Герой ловит себя на мысли, что уже третий раз 'перезапускает' этот день, чтобы не умереть от грязекраба. 'Это читерство?.. Нет, это тактика'.",
  chance: 0.01
    },
    {
  id: 'travel_narrative_deja_vu',
  type: 'narrative',
  description: "Герой уверен, что уже проходил здесь... и уже видел эту скалу... и этого мёртвого волка... Странно.",
  chance: 0.04
    },
    {
  id: 'travel_narrative_whispering_wind',
  type: 'narrative',
  description: "Ветер шепчет на древнем языке. Герой почти понимает... но нет. Просто ветер.",
  chance: 0.03
    },
    {
  id: 'travel_narrative_friendly_dog',
  type: 'narrative',
  description: "Пёс из Вайтрана (или просто очень похожий) бежит навстречу, виляет хвостом и идёт рядом. Пока не увидит другого героя.",
  chance: 0.06
    },
    {
  id: 'travel_narrative_mudcrab_revenge',
  type: 'narrative',
  description: "Герой замечает, что за ним по пятам следует целая процессия грязекрабов. Один из них явно обижен.",
  chance: 0.015
    },
    // Item Events
    {
        id: 'travel_find_gold',
        type: 'item',
        description: "По пути герой находит брошенный кошелек.",
        chance: 0.08,
        itemId: 'gold',
        itemQuantity: 25
    },
    {
        id: 'travel_find_potion',
        type: 'item',
        description: "У тела давно погибшего искателя приключений герой находит зелье.",
        chance: 0.05,
        itemId: 'potion_health_weak',
        itemQuantity: 1
    },
     {
        id: 'travel_find_tome',
        type: 'item',
        description: "В сгоревшем рюкзаке у дороги герой находит уцелевший том заклинаний.",
        chance: 0.02,
        itemId: 'tome_healing_touch',
        itemQuantity: 1
    },
    {
        id: 'travel_find_armor',
        type: 'item',
        description: "У тела давно погибшего искателя приключений герой находит потрепанные, но все еще крепкие наручи.",
        chance: 0.04,
        itemId: 'armor_bracers_leather',
        itemQuantity: 1
    },
    {
        id: 'travel_find_junk_gem',
        type: 'item',
        description: "На обочине герой замечает блестящий предмет. Это оказался аметист, который может пригодиться.",
        chance: 0.03,
        itemId: 'misc_gem_amethyst',
        itemQuantity: 1
    },
    {
  id: 'travel_find_sweet_roll',
  type: 'item',
  description: "Под кустом герой находит сладкий рулет. Кто-то явно торопился... или просто очень щедрый.",
  chance: 0.06,
  itemId: 'food_sweet_roll',
  itemQuantity: 1
    },
    {
  id: 'travel_find_rusty_sword',
  type: 'item',
  description: "В грязи торчит ржавый меч. Выглядит ужасно, но... вдруг повезёт? (Нет, не повезёт.)",
  chance: 0.1,
  itemId: 'weapon_sword_rusty',
  itemQuantity: 1
    },
    {
  id: 'travel_find_note_mysterious',
  type: 'item',
  description: "На обочине — мокрый клочок пергамента с надписью: 'Они следят за мной...'. Герой складывает его и идёт дальше. Быстрее.",
  chance: 0.03,
  itemId: 'misc_note_mysterious',
  itemQuantity: 1
    },


    // NPC Events
    {
        id: 'travel_meet_merchant',
        type: 'npc',
        description: "Герой встречает странствующего торговца.",
        chance: 0.05,
        npcId: 'traveling_merchant'
    },
     {
        id: 'travel_meet_hunter',
        type: 'npc',
        description: "Навстречу идет охотник, выслеживающий добычу.",
        chance: 0.05,
        npcId: 'hunter'
    },
     {
        id: 'travel_meet_maiq',
        type: 'npc',
        description: "Герой замечает одинокую фигуру в капюшоне. Это М'айк Лжец.",
        chance: 0.01,
        npcId: 'maiq_the_liar'
    },
    {
  id: 'travel_meet_pilgrim',
  type: 'npc',
  description: "По дороге идёт паломник с посохом и мешком. Он кивает герою и говорит: 'Шор с тобой, брат'.",
  chance: 0.04,
  npcId: 'pilgrim'
    },
    {
  id: 'travel_meet_fugitive',
  type: 'npc',
  description: "Из кустов выскакивает запыхавшийся беглец: 'Ты не видел стражников, да?.. Нет? Отлично!' — и исчезает в лесу.",
  chance: 0.03,
  npcId: 'fugitive'
    },
    {
  id: 'travel_meet_cow',
  type: 'npc',
  description: "На дороге мирно пасётся корова. Она смотрит на героя с таким видом, будто именно он должен уступить дорогу.",
  chance: 0.07,
  npcId: 'cow'
    },

    // Narrative Events
    {
        id: 'travel_narrative_beautiful_view',
        type: 'narrative',
        description: "С холма открывается захватывающий вид на долину. Герой на мгновение останавливается, чтобы полюбоваться.",
        chance: 0.1
    },
    {
        id: 'travel_narrative_weather_rain',
        type: 'narrative',
        description: "Небо затягивается тучами, и начинается легкий дождь. Дорога становится скользкой.",
        chance: 0.08,
        seasons: ['Spring', 'Summer', 'Autumn']
    },
    {
        id: 'travel_narrative_weather_snow',
        type: 'narrative',
        description: "Начинается легкий снегопад, покрывая все вокруг белым одеялом.",
        chance: 0.1,
        seasons: ['Winter']
    },
     {
        id: 'travel_narrative_dragon_roar',
        type: 'narrative',
        description: "Где-то вдалеке слышится громогласный рев. Дракон? Герой инстинктивно пригибается.",
        chance: 0.02,
    },
    {
        id: 'travel_narrative_stumble_fall',
        type: 'narrative',
        description: "Герой пытается перепрыгнуть ручей, но поскальзывается на мокром камне и смешно падает в воду. Потеряно немного гордости, но не здоровья.",
        chance: 0.07,
    },
    {
        id: 'travel_narrative_suspicious_cave',
        type: 'narrative',
        description: "Герой проходит мимо входа в темную пещеру. Оттуда доносятся странные звуки. Пока что лучше не рисковать.",
        chance: 0.05,
    },
    {
        id: 'travel_explore_battlefield',
        type: 'narrative',
        description: "Герой натыкается на следы недавней битвы. Он решает осмотреться в поисках чего-нибудь ценного.",
        chance: 0.05,
    },
    {
  id: 'travel_narrative_lost_arrow',
  type: 'narrative',
  description: "Герой находит стрелу, воткнутую в дерево. На оперении — знак гильдии воров. Интересно, что они стреляли?",
  chance: 0.05
    },
    {
  id: 'travel_narrative_forgotten_camp',
  type: 'narrative',
  description: "У кострища — остывшие угли и разбросанные вещи. Похоже, кто-то ушёл в спешке... или его унесли.",
  chance: 0.06
    },
    {
  id: 'travel_narrative_echo_in_canyon',
  type: 'narrative',
  description: "Герой кричит в ущелье — и в ответ слышит не эхо, а чей-то смех. Лучше не повторять.",
  chance: 0.04
    },
    {
  id: 'travel_narrative_storm_approaching',
  type: 'narrative',
  description: "На горизонте сгущаются чёрные тучи. Гроза будет сильной. Может, стоит поискать укрытие?",
  chance: 0.08,
  seasons: ['Summer', 'Autumn']
    },
    {
  id: 'travel_narrative_northern_lights',
  type: 'narrative',
  description: "Над горами вспыхивают северные сияния. Даже драконы, наверное, любуются таким зрелищем.",
  chance: 0.05,
  seasons: ['Winter'],
    },
    {
  id: 'travel_narrative_heavy_backpack',
  type: 'narrative',
  description: "Рюкзак стал таким тяжёлым, что герой спотыкается на ровном месте. Пора что-то выбросить... или украсть повозку.",
  chance: 0.09
    },
    {
  id: 'travel_narrative_distant_music',
  type: 'narrative',
  description: "Издалека доносится мелодия флейты. Кто-то играет в лесу. Герой решает не искать источник — в Skyrim это редко заканчивается хорошо.",
  chance: 0.05
    },
    {
  id: 'travel_narrative_footprints',
  type: 'narrative',
  description: "На мягкой земле — свежие следы. Человеческие... и ещё чьи-то. Очень большие. И с когтями.",
  chance: 0.06
    },
    {
  id: 'travel_narrative_broken_wagon',
  type: 'narrative',
  description: "На обочине — перевёрнутая повозка. Лошади нет, но в ящике ещё остались бутылки эля. Видимо, кто-то уже 'помог' хозяину.",
  chance: 0.07
    },
];

