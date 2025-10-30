export type Shout = {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
};

export const allShouts: Shout[] = [
  {
    id: 'unrelenting_force',
    name: 'Безжалостная сила',
    description: 'Fus • Ro • Dah — мощная волна, отбрасывающая врагов.',
    icon: 'Wind',
  },
  {
    id: 'fire_breath',
    name: 'Огненное дыхание',
    description: 'Yol • Toor • Shul — дыхание дракона испепеляет всё на пути.',
    icon: 'Flame',
  },
  {
    id: 'become_ethereal',
    name: 'Стать эфемерным',
    description: 'Feim • Zii • Gron — на мгновение становитесь невосприимчивы к урону.',
    icon: 'Sparkles',
  },
];


