
import type { Spell } from '@/types/spell';

export const allSpells: Spell[] = [
    // === DESTRUCTION ===
    {
        id: 'flames',
        name: 'Пламя',
        description: 'Поток огня, наносящий урон цели.',
        type: 'damage',
        manaCost: 15,
        value: 10,
        icon: 'Flame',
    },
    {
        id: 'ice_spike',
        name: 'Ледяное копье',
        description: 'Ледяной шип, который наносит урон холодом.',
        type: 'damage',
        manaCost: 25,
        value: 20,
        icon: 'Snowflake',
    },
    {
        id: 'lightning_bolt',
        name: 'Разряд молнии',
        description: 'Удар молнии, наносящий урон электричеством.',
        type: 'damage',
        manaCost: 30,
        value: 25,
        icon: 'Zap',
    },
    {
        id: 'fireball',
        name: 'Огненный шар',
        description: 'Взрыв огня, наносящий значительный урон.',
        type: 'damage',
        manaCost: 50,
        value: 40,
        icon: 'FlameKindling',
    },
     {
        id: 'sun_fire',
        name: 'Солнечный огонь',
        description: 'Вспышка священного огня, особенно эффективная против нежити.',
        type: 'damage',
        manaCost: 20,
        value: 18,
        icon: 'Sun',
    },

    // === RESTORATION ===
    {
        id: 'healing_touch',
        name: 'Исцеляющее касание',
        description: 'Слабое заклинание лечения, восстанавливающее немного здоровья.',
        type: 'heal',
        manaCost: 20,
        value: 25,
        icon: 'HeartHandshake',
    },
    {
        id: 'fast_healing',
        name: 'Быстрое лечение',
        description: 'Более мощное заклинание, быстро восстанавливающее здоровье.',
        type: 'heal',
        manaCost: 40,
        value: 50,
        icon: 'HeartPulse',
    },
     {
        id: 'close_wounds',
        name: 'Закрыть раны',
        description: 'Сильное заклинание, закрывающее даже серьезные раны.',
        type: 'heal',
        manaCost: 70,
        value: 100,
        icon: 'PlusCircle',
    },
    
    // === ALTERATION ===
    {
        id: 'oakflesh',
        name: 'Дубовая плоть',
        description: 'Увеличивает класс брони на 40 ед. на 60 секунд.',
        type: 'buff',
        manaCost: 35,
        value: 40, // armor rating
        duration: 60000,
        icon: 'TreeDeciduous',
    },
    
    // === CONJURATION ===
    {
        id: 'vampiric_drain',
        name: 'Вампирское высасывание',
        description: 'Высасывает здоровье у врага и передает его заклинателю.',
        type: 'drain',
        manaCost: 25,
        value: 15, // damage amount, heal will be a fraction of this
        icon: 'HeartCrack',
    },

    // === ILLUSION ===
    {
        id: 'arcane_intellect',
        name: 'Тайный интеллект',
        description: 'Увеличивает максимальный запас магии на 25 ед. на 5 минут.',
        type: 'buff',
        manaCost: 50,
        value: 25, // magicka increase
        duration: 300000,
        icon: 'BrainCircuit',
    },
    {
        id: 'energize',
        name: 'Прилив сил',
        description: 'Мгновенно восстанавливает часть запаса сил.',
        type: 'restore',
        manaCost: 15,
        value: 40, // stamina restored
        icon: 'BatteryCharging',
    }
];
