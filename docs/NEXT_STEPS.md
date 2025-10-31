# Следующие шаги для завершения миграции

## ✅ Что уже сделано

1. **Backend полностью готов**
   - Все API endpoints созданы
   - CORS настроен для SvelteKit
   - WebSocket сервер работает
   - Документация API создана

2. **SvelteKit базовая структура**
   - Конфигурация (Vite, SvelteKit, TailwindCSS, DaisyUI)
   - API client с CSRF
   - WebSocket service
   - Stores (auth, character, gameEvents)
   - i18n (ru/en)
   - Типы и data скопированы
   - Начальные страницы (Home, Login, Register)

---

## 📋 Что нужно сделать далее

### 1. Установить зависимости и запустить

```bash
# Установить зависимости SvelteKit
cd /workspace/sveltekit
npm install

# Создать .env
cp .env.example .env

# Запустить SvelteKit dev server
npm run dev
```

### 2. Создать недостающие Auth API endpoints

Нужно создать в Next.js backend:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me` - получить текущего пользователя

### 3. Создать страницу Character Creation

Файл: `/sveltekit/src/routes/create-character/+page.svelte`

Должна включать:
- Выбор имени
- Выбор расы (Nordic, Imperial, Dark Elf, etc.)
- Выбор пола
- Backstory
- Выбор покровителя (patron deity)
- Распределение стартовых характеристик

### 4. Создать Dashboard

Файл: `/sveltekit/src/routes/dashboard/+layout.svelte`
Файл: `/sveltekit/src/routes/dashboard/+page.svelte`

Dashboard должен включать:
- Навигационное меню (горизонтальное)
- Журнал приключений (adventure log)
- Текущий статус персонажа (HP, MP, SP)
- Быстрые действия (divine intervention)
- Прогресс активного квеста
- WebSocket подключение для реал-тайм обновлений

### 5. Миграция остальных страниц

По порядку:
1. Character page (`/dashboard/character`)
2. Inventory (`/dashboard/inventory`)
3. Quests (`/dashboard/quests`)
4. Map (`/dashboard/map`) - с Leaflet
5. Market (`/dashboard/market`)
6. Crafting (`/dashboard/crafting`)
7. Factions (`/dashboard/factions`)
8. Society (`/dashboard/society`)
9. Admin pages

### 6. После каждой страницы

- ✅ Проверить функциональность
- ✅ Проверить API calls
- ✅ Проверить WebSocket обновления
- ✅ Проверить i18n
- ✅ Проверить responsive design
- ✅ **Удалить соответствующие Next.js компоненты**

---

## Пример создания Auth API endpoints

Создать файл `/workspace/src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as storage from '../../../../../server/storage';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await storage.createSession({
      token: sessionToken,
      userId: user.id,
      expiresAt,
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Аналогично создать `/api/auth/register/route.ts`, `/api/auth/logout/route.ts`, `/api/auth/me/route.ts`.

---

## Пример Dashboard layout

Файл: `/sveltekit/src/routes/dashboard/+layout.svelte`

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { realtime, isConnected, connectionError } from '$lib/realtime';
	import { character } from '$stores/character';
	import { authStore } from '$stores/auth';
	import { _ } from 'svelte-i18n';
	
	let { data, children } = $props();
	
	$effect(() => {
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		
		if (data.character) {
			character.set(data.character);
			realtime.connect('global', data.character.id);
		}
	});
	
	onDestroy(() => {
		realtime.disconnect();
	});
</script>

<div class="drawer lg:drawer-open">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content flex flex-col">
		<!-- Navbar -->
		<div class="navbar bg-base-300 shadow-lg">
			<div class="flex-none lg:hidden">
				<label for="my-drawer" class="btn btn-square btn-ghost">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="inline-block h-6 w-6 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						></path>
					</svg>
				</label>
			</div>
			<div class="flex-1">
				<a href="/dashboard" class="btn btn-ghost text-xl text-skyrim-gold">
					{$character?.name || 'Elder Scrolls Game'}
				</a>
			</div>
			<div class="flex-none">
				<!-- Connection status -->
				{#if $isConnected}
					<div class="badge badge-success gap-2">
						<div class="w-2 h-2 rounded-full bg-green-400"></div>
						Online
					</div>
				{:else}
					<div class="badge badge-error gap-2">
						<div class="w-2 h-2 rounded-full bg-red-400"></div>
						Offline
					</div>
				{/if}
			</div>
		</div>

		<!-- Page content -->
		<div class="p-4">
			{@render children()}
		</div>
	</div>

	<!-- Sidebar -->
	<div class="drawer-side">
		<label for="my-drawer" class="drawer-overlay"></label>
		<ul class="menu bg-base-200 min-h-full w-80 p-4">
			<li><a href="/dashboard">{$_('dashboard.title')}</a></li>
			<li><a href="/dashboard/character">{$_('character.title')}</a></li>
			<li><a href="/dashboard/inventory">{$_('inventory.title')}</a></li>
			<li><a href="/dashboard/quests">{$_('quests.title')}</a></li>
			<li><a href="/dashboard/map">{$_('map.title')}</a></li>
			<li><a href="/dashboard/market">{$_('market.title')}</a></li>
			<li><a href="/dashboard/crafting">{$_('crafting.title')}</a></li>
			<li><a href="/dashboard/factions">{$_('factions.title')}</a></li>
			<li><a href="/dashboard/society">Society</a></li>
			<li><a href="/dashboard/chronicle">Chronicle</a></li>
		</ul>
	</div>
</div>
```

Файл: `/sveltekit/src/routes/dashboard/+layout.server.ts`

```typescript
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
	const sessionToken = cookies.get('session_token');

	if (!sessionToken) {
		throw redirect(303, '/login');
	}

	try {
		// Get current user
		const userRes = await fetch('http://localhost:5000/api/auth/me', {
			headers: {
				Cookie: `session_token=${sessionToken}`
			}
		});

		if (!userRes.ok) {
			throw redirect(303, '/login');
		}

		const userData = await userRes.json();

		// Get character
		const charRes = await fetch(`http://localhost:5000/api/characters/${userData.user.id}`, {
			headers: {
				Cookie: `session_token=${sessionToken}`
			}
		});

		if (!charRes.ok) {
			// No character yet, redirect to creation
			throw redirect(303, '/create-character');
		}

		const charData = await charRes.json();

		return {
			user: userData.user,
			character: charData.character
		};
	} catch (error) {
		throw redirect(303, '/login');
	}
};
```

---

## Команды для запуска всего стека

```bash
# Terminal 1: Backend + Worker + Realtime
cd /workspace
npm run dev:all

# Terminal 2: SvelteKit frontend
cd /workspace/sveltekit
npm run dev
```

Откройте браузер:
- Backend API: http://localhost:5000
- SvelteKit: http://localhost:5173
- WebSocket: ws://localhost:5050

---

## Приоритеты

1. **Высокий приоритет** (нужно для базовой работы):
   - Auth API endpoints
   - Character Creation page
   - Dashboard layout + home page
   - WebSocket integration на Dashboard

2. **Средний приоритет**:
   - Character page
   - Inventory page
   - Quests page
   - Map page

3. **Низкий приоритет** (можно делать постепенно):
   - Market
   - Crafting
   - Factions
   - Society
   - Admin panel

---

## Удаление Next.js компонентов

После полной миграции и тестирования:

1. Удалить `/src/app/` (кроме `/src/app/api/`)
2. Удалить `/src/components/`
3. Обновить `package.json` - убрать Next.js зависимости, оставить только backend
4. Обновить scripts в root `package.json`:
   ```json
   {
     "scripts": {
       "backend": "next dev -p 5000 -H 0.0.0.0",
       "worker": "tsx server/run-worker.ts",
       "realtime": "tsx server/realtime.ts",
       "dev": "concurrently \"npm run backend\" \"npm run worker\" \"npm run realtime\"",
       "frontend": "cd sveltekit && npm run dev"
     }
   }
   ```

---

## Готовность к production

Перед деплоем убедитесь:
- [ ] Все endpoints работают
- [ ] WebSocket стабилен
- [ ] CSRF токены работают
- [ ] Sessions работают корректно
- [ ] i18n полностью переведен
- [ ] Responsive design на всех экранах
- [ ] Тесты написаны (опционально)
- [ ] Environment variables настроены для production
- [ ] HTTPS для cookies (secure: true)
- [ ] CORS настроен для production domain

---

## Полезные ссылки

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Tabler Icons](https://tabler-icons.io/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [svelte-i18n](https://github.com/kaisermann/svelte-i18n)
