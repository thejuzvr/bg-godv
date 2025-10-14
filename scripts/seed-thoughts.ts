import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { gameThoughts } from '../shared/schema.js';

// Optional: reuse known location IDs for conditions
import { initialLocations } from '../src/data/locations.js';

type ThoughtSeed = {
  id: string;
  text: string;
  tags?: string[] | null;
  conditions?: Record<string, any> | null;
  weight?: number;
  cooldownKey?: string | null;
  locale?: string;
  isEnabled?: boolean;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(prefix: string, idx: number): string {
  return `${prefix}_${String(idx + 1).padStart(2, '0')}`;
}

const cityIds = initialLocations.filter(l => l.type === 'city' || l.type === 'town').map(l => l.id);

const humorLines: string[] = [
  'Сегодня я не встретил Назима. Кажется, судьба ко мне благосклонна.',
  'Ведро на голове — это модно. Я дизайнер, я так вижу.',
  'Если бы у меня был ещё один карман — я бы положил туда ещё один сыр.',
  'Курица смотрит осуждающе. Я ничего не делал. В этот раз.',
  'Фус Ро Да… пока только в голове. Но звучит мощно!',
  'Сладкие булочки — топливо драконьих душ.',
  'Где-то рядом М\'Айк. Он наверняка знает ответ. Но не скажет.',
  'Я бы с радостью спас мир, но у меня встреча с пекарем.',
  'Кажется, я снова перепутал healing potion с зельем веса. Бывает.',
  'У кого-то стрелы в колене. У меня — сыр в сумке. Каждый выбирает своё.',
  'Талморцы опять смотрят. Пожалуй, надену ведро и сделаю вид, что меня нет.',
  'Как же тяжело быть героем. Особенно когда не хватает сна.',
  'Судьба зовёт. Но таверна зовёт громче.',
  'Сыр — это круглая радость. Особенно сорок седьмой по счёту.',
  'Если я надену два ведра на голову — стану ли я вдвое умнее?',
  'У меня есть план: сначала поесть. Потом импровизация.',
  'Сладкий рулет — достойная цель любого квеста.',
  'Главное — не смотреть курице в глаза. Она помнит.',
  'Я слышал шёпот богов. Они сказали: «ещё сыр».',
  'Ха! Ещё один день без стрелы в колене — уже победа.',
  'Мой компаньон снова потерялся… где-то между дверьми и реальностью.',
  'Нужно сделать вид, что я планировал всё это. Даже падение с крыши.',
  'Слово силы «Уборка» мне бы не помешало. В инвентаре хаос.',
  'Никто не заметит, если булочка исчезнет. Никто.',
  'Стража сказала «Остановитесь!». Я остановился. Герой же законопослушный.',
];

const memeLines: string[] = [
  'Фус… Ро… Да! (внутренне) — когда видишь гору сыра.',
  'М\'Айк говорит: «Правда сложна». Особенно без карты.',
  'В Облачном квартале я бываю. Я БЫВАЮ, Назим!',
  'Довакин, Довакин… а обед когда?',
  'Томас Поровозик-дракон? Мне это приснилось… надеюсь.',
  'Стражник: «Был бы я на твоём месте…» — нет, не надо.',
  'Свитки древних — это конечно хорошо, но где булочки?',
  '«Это не баг — это особенность Нирна», — сказал М\'Айк и исчез.',
  'Если бы у меня был мод на порядок в сумке… эх.',
  'Шеогорат наверняка доволен моей жизнью. Я — нет.',
  'Покормить карманного мамонта нельзя. Жаль.',
  'Кажется, я случайно женился на торговке. Или это сон?',
  'Стук по столу: «Где мой крик?». Эхо отвечает: «В очереди».',
  'Свитки говорят, что судьба предрешена. Но я всё равно сверну налево.',
  'Драконы — это, конечно, опасно. Но цены в таверне — страшнее.',
  'Каджит с товаром где-то рядом. Надеюсь, не с моей сумкой.',
  'Воронка багов поглотила моего компаньона. Минутой молчания почтим.',
  'Курицы — хранители лора. Никогда их не зли.',
  'Талос со мной… надеюсь.',
  'Карта показывает путь. А ноги — в сторону кухни.',
  'Баг с лестницей? Я так и думал.',
  'Свиток на «развесёлый танец»? Где подписаться?',
  'Дракон кричал, я кричал, все кричали. Весело было.',
  'Мой конь — альпинист. Я — не очень.',
  'Спрятался в ведре. Меня точно не видно.',
];

const normalLines: string[] = [
  'Тихий день. Самое время привести мысли в порядок.',
  'Дорога зовёт. Иду, пока не стемнело.',
  'Снег хрустит под ногами, воздух свежий и бодрит.',
  'Дождь стучит по плащу. Надо бы найти укрытие.',
  'Вечерело. Пора подумать о ночлеге.',
  'В городе спокойно. Можно заняться делами.',
  'Сумка тяжёлая, но пригодится всё. Наверное.',
  'Шерсть плаща пахнет дымом. Вчерашний костёр был тёплым.',
  'Путь прямой, но мысли петляют.',
  'Хорошо бы пополнить запасы зелий.',
  'Нужно не забыть заглянуть к кузнецу.',
  'Остановлюсь здесь на минуту. Просто посмотреть на небо.',
  'Шаги отдаются эхом в руинах.',
  'Туман укрывает холмы. Всё выглядит иначе.',
  'Сердце бьётся ровно. Вперёд, к новым встречам.',
  'Ещё один день — ещё шаг к цели.',
  'Свет факела пляшет на стенах. Тени живут своей жизнью.',
  'Лёгкая усталость, но настроение держится.',
  'Снегопад затихает. Дорога вновь открыта.',
  'Вдоль дороги слышны песни путешественников.',
  'Городские огни кажутся близко. Скоро буду там.',
  'Сегодня обойдусь без приключений. Пусть будет так.',
  'Ветер несёт запах хвои и свежести.',
  'Далёкий гром напоминает о скором дожде.',
  'Надо бы записать пару мыслей в дневник.',
];

// Helper to attach diverse conditions to lines cyclically
const conditionsPool: Array<Record<string, any>> = [
  { status: ['idle'], timeOfDay: ['day'] },
  { status: ['busy'], timeOfDay: ['evening'] },
  { weather: ['Rain'] },
  { weather: ['Snow'] },
  { hpBelow: 0.3 },
  { locations: [pick(cityIds)] },
  { season: ['Winter'] },
  { season: ['Summer'] },
  { timeOfDay: ['night'] },
  { factionsAny: ['companions'] },
  { questFlagsAny: ['sovngarde_active'] },
  { questFlagsAny: ['completed:main_started'] },
];

function buildSeeds(): ThoughtSeed[] {
  const seeds: ThoughtSeed[] = [];
  const pushBatch = (prefix: string, lines: string[], tag: string | null) => {
    lines.forEach((text, i) => {
      const idx = seeds.length;
      const cond = conditionsPool[idx % conditionsPool.length];
      seeds.push({
        id: makeId(prefix, i),
        text,
        tags: tag ? [tag] : [],
        conditions: cond,
        weight: 1 + (idx % 3),
        cooldownKey: null,
        locale: 'ru',
        isEnabled: true,
      });
    });
  };

  pushBatch('humor', humorLines, 'meme');
  pushBatch('meme', memeLines, 'skyrim_meme');
  pushBatch('normal', normalLines, 'generic');

  // If total < 70, add extra derived lines
  while (seeds.length < 70) {
    const idx = seeds.length;
    const cond = conditionsPool[idx % conditionsPool.length];
    seeds.push({
      id: makeId('extra', idx),
      text: `Мысль №${idx + 1}: тихая решимость и немного юмора.`,
      tags: idx % 2 === 0 ? ['generic'] : ['meme'],
      conditions: cond,
      weight: 1 + (idx % 2),
      cooldownKey: null,
      locale: 'ru',
      isEnabled: true,
    });
  }

  return seeds.slice(0, 70);
}

async function seedThoughts() {
  console.log('🧠 Seeding 70 thoughts into game_thoughts...');
  const seeds = buildSeeds();
  try {
    await db.insert(gameThoughts).values(seeds as any).onConflictDoNothing();
    console.log(`✅ Inserted ${seeds.length} thoughts (existing skipped).`);
  } catch (e) {
    console.error('❌ Failed to seed thoughts:', e);
    throw e;
  } finally {
    await pool.end();
  }
}

seedThoughts();


