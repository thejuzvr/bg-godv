1)  [TickWorker] processing tick for 4ccfa97c-69d8-4436-9a88-66bd51adc0fb at 2025-10-19T20:30:34.035Z
[1] Ошибка в игровом цикле: TypeError: Cannot read properties of undefined (reading 'damage')
[1]     at doEnemyTurn (C:\replit actual\bg-godv\src\ai\brain.ts:782:58)
[1]     at performCombatRound (C:\replit actual\bg-godv\src\ai\brain.ts:805:29)
[1]     at Object.perform (C:\replit actual\bg-godv\src\ai\brain.ts:2411:35)
[1]     at processCharacterTurn (C:\replit actual\bg-godv\src\ai\brain.ts:3271:37)
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[1]     at async processGameTick (C:\replit actual\bg-godv\src\ai\game-engine.ts:1682:28)
[1]     at async <anonymous> (C:\replit actual\bg-godv\server\workers\tickWorker.ts:107:24)
[1]     at async withIdempotency (C:\replit actual\bg-godv\server\workers\tickWorker.ts:37:12)
[1]     at async Worker.processFn (C:\replit actual\bg-godv\server\workers\tickWorker.ts:73:18)
[1]     at async <anonymous> (C:\replit actual\bg-godv\node_modules\bullmq\src\classes\worker.ts:939:26)
[1] [QueueEvents] completed job global:4ccfa97c-69d8-4436-9a88-66bd51adc0fb:1760905834035

Ошибка во время драки.

2)Пульт вмешательства некоректно обрабатывает остаток силы - например, было 84, я использовал "Благословить" оно отблавляет значение, затем возвращает, через 5 секунд возвращает правильное значение. (Выглядит как кэш.)