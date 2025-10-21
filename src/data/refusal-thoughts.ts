/**
 * Refusal thoughts - when hero ignores divine suggestion
 * Godville-style sarcastic responses
 */

export const refusalThoughts = [
  "Странно, хочется пойти {location}, но я хочу выпить в таверне, поэтому не пойду.",
  "Боги шепчут идти в {location}... Но сейчас мне больше хочется поспать.",
  "Внутренний голос зовет в {location}. Но внешний голос говорит «Эль не сам себя не выпьет».",
  "Чувствую странную тягу к {location}. Или это просто голод? Да, точно голод.",
  "Что-то манит в {location}... Но манит ещё сильнее — вон та пекарня.",
  "Может, и стоило бы навестить {location}. Но это ведь так далеко...",
  "Интересно, что там в {location}? Впрочем, здесь тоже неплохо.",
  "Вселенная намекает на {location}. Я намекаю вселенной на отдых.",
  "{location} звучит заманчиво. Но вздремнуть звучит ещё заманчивее.",
  "А не отправиться ли мне в {location}? ...Нет, не отправиться.",
  "Боги указывают путь в {location}. А я укажу путь в таверну.",
  "Судьба зовет в {location}. Судьба может и подождать.",
  "{location}? Пожалуй, в другой раз. Сегодня день ленивого героя.",
  "Какая-то сила тянет меня в {location}. Но лень — сила покрепче.",
  "Слышу голос: «Иди в {location}!» Отвечаю голосу: «Сам иди!»"
];

/**
 * Select random refusal thought with location name inserted
 */
export function getRefusalThought(locationName: string): string {
  const template = refusalThoughts[Math.floor(Math.random() * refusalThoughts.length)];
  return template.replace('{location}', locationName);
}
