## Руководство по внешнему виду (UI), теме и навигации

Документ описывает визуальную систему приложения, тему (цвета/шрифты/токены), логику меню и вспомогательные утилиты. Его цель — упростить перенос внешнего вида и поведения UI в другой проект.

### 1) Библиотеки и зависимости

- React + React Router (маршрутизация)
- Tailwind CSS + плагины: `@tailwindcss/forms`, `tailwindcss-animate`
- Иконки: `lucide-react` (обёртка `AppIcon`)

Минимальный набор для переноса:

```bash
npm i tailwindcss postcss autoprefixer @tailwindcss/forms tailwindcss-animate lucide-react react-router-dom
```

### 2) Тема: цветовые токены и базовые стили

Основная идея — все цвета задаются через CSS-переменные на `:root`, а в Tailwind подключаются как токены. Благодаря этому можно менять палитру, не переписывая компоненты.

Ключевые переменные (сокращённый список):

```css
:root {
  /* База */
  --color-background: #ECF0F1; /* фон */
  --color-foreground: #2C3E50; /* основной текст */
  --color-border: #34495E;
  --color-input: #FFFFFF;
  --color-ring: #F39C12; /* акцент-обводка */

  /* Поверхности */
  --color-card: #FFFFFF;
  --color-card-foreground: #2C3E50;
  --color-popover: #FFFFFF;
  --color-popover-foreground: #2C3E50;

  /* Мутные/вторичные */
  --color-muted: #ECF0F1;
  --color-muted-foreground: #7F8C8D;

  /* Основные палитры */
  --color-primary: #2C3E50;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #34495E;
  --color-secondary-foreground: #FFFFFF;
  --color-accent: #F39C12; /* «нордическое золото» */
  --color-accent-foreground: #2C3E50;

  /* Статусы */
  --color-success: #27AE60;
  --color-success-foreground: #FFFFFF;
  --color-warning: #E67E22;
  --color-warning-foreground: #FFFFFF;
  --color-error: #E74C3C;
  --color-error-foreground: #FFFFFF;
  --color-destructive: #E74C3C;
  --color-destructive-foreground: #FFFFFF;
}
```

В Tailwind (`tailwind.config.js`) эти переменные подключены как токены `background`, `foreground`, `accent`, `muted`, `card`, `success`, `warning`, `error` и т.д. Поэтому в JSX используются классы вида:

- Фон/текст: `bg-background text-foreground`
- Карточки: `bg-card border border-border`
- Акценты: `bg-accent text-accent-foreground`
- Подписи: `text-muted-foreground`

Доп. утилиты темы:

- Тени: `shadow-nordic`, `shadow-nordic-lg`
- Переходы: `transition-nordic`, `transition-nordic-slow`
- Высокие уровни `z-index`: `z-1000`, `z-1500`, `z-2000`

### 3) Шрифты и типографика

Шрифтовая система (подключается через Google Fonts в `tailwind.css`):

- Заголовки: `Cinzel` → утилита `.font-heading`
- Основной текст: `Open Sans` → утилита `.font-body`
- Мелкие подписи: `Roboto` → утилита `.font-caption`
- Данные/моноширинный: `JetBrains Mono` → утилита `.font-data`

Практика применения:

- Заголовки разделов/страниц: `className="font-heading text-2xl/3xl font-semibold"`
- Обычный текст: `className="font-body"`
- Подписи/мелкий текст: `className="font-caption text-xs"`
- Технические метки/время: `className="font-data text-xs"`

### 4) Tailwind: расширения и плагины

- В `theme.extend` объявлены цвета из токенов, шрифты, тени, тайминги и отступы.
- Подключены плагины: `@tailwindcss/forms` (ровные инпуты), `tailwindcss-animate` (простые анимации).
- Контент-сканер Tailwind должен покрывать `./index.html` и `./src/**/*.{js,ts,jsx,tsx}`.

### 5) Иконки

Используется `lucide-react` через обёртку `AppIcon`:

```jsx
import Icon from '@components/AppIcon';

<Icon name="Swords" size={20} />      // имя = ключ из lucide-react
<Icon name="Coins" size={20} />
```

Если имя не найдено, отображается `HelpCircle` (серый значок по умолчанию).

### 6) Навигация и меню

Компонент `MainNavigation` реализует:

- Desktop-шапку (fixed top, `z-1000`, высота 64px), с набором кнопок навигации
- Mobile нижнюю панель (fixed bottom), с иконками и подписями
- Выделение активного пункта по `location.pathname`
- Кнопку «Выход» справа (desktop) и в выпадающем меню (mobile)

Структура данных меню:

```js
const navigationItems = [
  { label: 'Главная', path: '/main-dashboard', icon: 'Home' },
  { label: 'Карта мира', path: '/world-map', icon: 'Map' },
  { label: 'Фракции', path: '/factions', icon: 'Users' },
  { label: 'Недвижимость', path: '/properties', icon: 'Home' },
  { label: 'Арена', path: '/arena', icon: 'Swords' },
  { label: 'Торговцы', path: '/trading', icon: 'Store' },
  { label: 'Божественное', path: '/divine-intervention', icon: 'Zap' },
];
```

Поведение:

- Desktop: кнопки в шапке; активный пункт — `bg-accent text-accent-foreground`
- Mobile: нижний бар; активный пункт — `text-accent`
- При клике `navigate(path)` и закрытие mobile-меню


### 9) Уведомления

Компонент `NotificationSystem`:

- Пропсы: `notifications`, `onDismiss(id)`, `position`
- Типы: `success`, `warning`, `error`, `info` → цвета и иконки подтягиваются из токенов
- Автозакрытие: `autoClose` + `duration` (мс), прогресс-бар анимируется CSS

Пример данных уведомления:

```js
{
  id: Date.now(),
  type: 'success',
  title: 'Успех!',
  message: 'Операция выполнена',
  timestamp: new Date(),
  autoClose: true,
  duration: 5000,
}
```

### 10) Паттерны компоновки

- Шапка фиксированная: контент стартует с отступом `pt-16`
- Контейнер страницы: `container mx-auto px-4 py-6`
- Карточки: `bg-card border border-border rounded-lg shadow-nordic`
- Кнопки-акценты: `bg-accent text-accent-foreground hover:bg-accent/90`
- Подписи и второстепенный текст: `text-muted-foreground`

### 12) Кастомизация темы

- Поменять палитру — обновите значения CSS-переменных в `:root`.
- Сменить шрифт — замените импорты Google Fonts и утилиты `.font-*`.
- Добавить размеры/тени — расширьте `theme.extend` в `tailwind.config.js`.

### 13) Быстрый шаблон карточки

```jsx
<section className="bg-card border border-border rounded-lg p-6 shadow-nordic">
  <h2 className="font-heading text-xl text-foreground mb-2">Заголовок</h2>
  <p className="font-body text-muted-foreground">Описание блока</p>
  <div className="mt-4">
    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-body hover:bg-accent/90 transition-nordic">
      Действие
    </button>
  </div>
  
</section>
```

---

Этот документ покрывает визуальные токены, компоненты навигации и системные утилиты. При следовании чек-листу внешний вид будет воспроизведён 1:1 в новом проекте, при этом тема останется централизованной и легко настраиваемой через CSS-переменные.


