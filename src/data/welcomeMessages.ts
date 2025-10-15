import type { Character } from '@/types/character';

const locationNames: Record<string, string> = {
  'solitude': 'Солитьюд',
  'riften': 'Рифтен',
  'winterhold': 'Винтерхолд',
  'whiterun': 'Вайтран',
  'dawnstar': 'Данстар',
  'bleak_falls_barrow': 'Бликфолс Барроу',
  'wilderness': 'Дикие земли',
  'windhelm': 'Виндхельм',
  'markarth': 'Маркарт'
};

const divinityNames: Record<string, string> = {
  'akayosh': 'Акатош',
  'arkay': 'Аркей',
  'dibella': 'Дибелла',
  'julianos': 'Юлианос',
  'kynareth': 'Кинарет',
  'mara': 'Мара',
  'stendarr': 'Стендарр',
  'talos': 'Талос',
  'zenithar': 'Зенитар'
};

export function getWelcomeMessage(character: Character): string {
  const locationName = locationNames[character.location] || 'неизвестном месте';
  const divinityName = divinityNames[character.patronDeity] || 'божеством';

  const messages: Record<string, string> = {
    'noble': `Добро пожаловать в ${locationName}, благородный ${character.name}! Ваше происхождение открывает многие двери в этом городе. ${divinityName} благословляет ваше путешествие.`,
    'thief': `Тени ${locationName} приветствуют вас, ${character.name}. В этом городе каждый уголок таит возможности для ловкого вора. ${divinityName} наблюдает за вашими делами.`,
    'scholar': `Добро пожаловать в ${locationName}, искатель знаний! Ваш путь к мудрости начинается здесь. ${divinityName} направляет ваше обучение.`,
    'warrior': `Ветеран ${character.name}, ${locationName} нуждается в ваших боевых навыках. Ваш опыт пригодится в этих неспокойных землях. ${divinityName} благословляет ваше оружие.`,
    'shipwrecked': `Вы очнулись на берегу около ${locationName}, ${character.name}. Судьба дала вам второй шанс. ${divinityName} спас вас от морских глубин.`,
    'left_for_dead': `Вы выжили в ${locationName}, ${character.name}. Смерть не смогла забрать вас - возможно, ${divinityName} имеет для вас особые планы.`,
    'companion': `Соратники приветствуют вас в ${locationName}, ${character.name}! Ваша честь и сила будут служить Скайриму. ${divinityName} благословляет ваше братство.`,
    'escaped_prisoner': `Свобода! Вы сбежали и оказались в ${locationName}, ${character.name}. Тюремные стены не смогли удержать вас. ${divinityName} дал вам второй шанс.`,
    'mercenary': `Добро пожаловать в ${locationName}, наемник ${character.name}. В этом городе всегда найдется работа для опытного бойца. ${divinityName} направляет вашу сталь.`,
    'pilgrim': `Благословенны будьте, паломник ${character.name}! ${locationName} приветствует ваше благочестие. ${divinityName} уже благоволит к вам.`
  };

  return messages[character.backstory] || `Добро пожаловать в ${locationName}, ${character.name}! Ваше приключение начинается здесь.`;
}

export function shouldShowWelcomeMessage(character: Character): boolean {
  return !character.hasSeenWelcomeMessage;
}

export function markWelcomeMessageSeen(character: Character): Character {
  return {
    ...character,
    hasSeenWelcomeMessage: true
  };
}
