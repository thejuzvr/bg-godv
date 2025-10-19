1) При закрытом сгенерированном квесте - нет отписки в журнале о выполнении:
[20:09:59]
Герой берется за городское дело: Помочь городской страже.

2) На странице Dashboard, при hover на Заклинания или активные эффекты - описание уходит под Layout.

3) Журнал боя сделать revert записей снизу - старые, сверху - новые.

4) Герой пожертвовал в свой храм 50 голды - прогресс не обновился.
5) Добавить заданиям после выполнения timeout - для обновления. Герой не может выполнить их дважды - не дождавшись таймаута в 30 минут. Для каждого.

Долгосрочные баги:
1) Боевые механики на переработку. Улучшим броски D20, поправим урон или уменьшим HP чтобы бои были честными и не длились слишком долго.

1. Я запускаю проект всегда через npm run dev:all
2. Он никогда не менялся и всегда ws://localhost:5050

При нажатии на божественном вмешательстве "Благословить" - то запись появится. Тики проходят успешно, 
PS C:\replit actual\bg-godv> npm run dev:all

> nextn@0.1.0 dev:all
> concurrently "npm run dev" "npm run worker" "npm run realtime"

[1] 
[1] > nextn@0.1.0 worker
[1] > tsx server/run-worker.ts
[1]
[0]
[0] > nextn@0.1.0 dev
[0] > next dev -p 5000 -H 0.0.0.0
[0]
[2]
[2] > nextn@0.1.0 realtime
[2] > tsx server/realtime.ts
[2]
[2] [Realtime] Socket.IO server listening on :5050
[0]    ▲ Next.js 15.3.3
[0]    - Local:        http://localhost:5000
[0]    - Network:      http://0.0.0.0:5000
[0]    - Environments: .env
[0]
[0]  ✓ Starting...
[1] === Starting ElderScrollsIdle Worker ===
[1] Feature flags: { FEATURE_BULLMQ: 'true' }
[1] [TickWorker] ready
[1] [Runner] BullMQ mode enabled. Starting tick worker and digest worker...
[1] [TickProducer] Starting tick producer with dynamic intervals...
[1] [TickProducer] Combat tick: 1 second
[1] [TickProducer] Adventure tick: 5-20 seconds (random)
[1] [DigestProducer] Starting digest producer...
[1] [DigestWorker] ready
[1] [DigestWorker] ready (runner)
[1] [TickWorker] processing tick for 7bced473-ece5-4470-b033-a907e4b1caa8 at 2025-10-18T17:49:55.591Z
[1] [TickProducer] Добавлен персонаж Генсьях: первый тик (приключение) через 9с
[0]  ✓ Ready in 2.3s
[1] [QueueEvents] completed job global:7bced473-ece5-4470-b033-a907e4b1caa8:1760809795591
[0]  ○ Compiling /dashboard ...
[0]  ✓ Compiled /dashboard in 6.9s (6544 modules)
[0]  ✓ Compiled in 952ms (3022 modules)
[0]  POST /dashboard 200 in 7951ms
[0]  POST /dashboard 200 in 33ms
[0]  POST /dashboard 200 in 109ms
[0]  POST /dashboard 200 in 27ms
[1] [TickProducer] Генсьях: следующий тик (приключение) через 18с
[1] [TickProducer] Enqueued 1 tick(s) | counts: {
[1]   delayed: 1,
[1]   waiting: 0,
[1]   active: 0,
[1]   completed: 550,
[1]   failed: 0,
[1]   paused: 0
[1] }