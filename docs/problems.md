[1] Failed to add chronicle entry: DrizzleQueryError: Failed query: insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"
[1] params: 0e918961-eff8-423e-bf80-ca1f80e4cdcc,314064f9-fb7e-44ea-ad95-d90775d93641,1760464064773,system
[1]     at NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:73:11)        
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]     at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]     ... 4 lines matching cause stack trace ...
[1]     at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20)
[1]     at async runBackgroundWorker (C:\replit\bg-godv\bg-godv\server\background-worker.ts:172:11) {
[1]   query: 'insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"',
[1]   params: [
[1]     '0e918961-eff8-423e-bf80-ca1f80e4cdcc',
[1]     '314064f9-fb7e-44ea-ad95-d90775d93641',
[1]     1760464064773,
[1]     'system'
[1]   ],
[1]   cause: error: null value in column "title" of relation "chronicle" violates not-null constraint
[1]       at C:\replit\bg-godv\bg-godv\node_modules\pg-pool\index.js:45:11
[1]       at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:161:13)
[1]       at async NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:71:12)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]       at async Object.addChronicleEntry (C:\replit\bg-godv\bg-godv\server\storage.ts:123:21)
[1]       at async addChronicleEntry (C:\replit\bg-godv\bg-godv\src\services\chronicleService.ts:17:9)
[1]       at async persistAchievementUnlocks (C:\replit\bg-godv\bg-godv\src\services\achievementsService.ts:82:5)
[1]       at async processGameTick (C:\replit\bg-godv\bg-godv\src\ai\game-engine.ts:920:13)
[1]       at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20) {
[1]     length: 317,
[1]     severity: 'ERROR',
[1]     code: '23502',
[1]     detail: 'Failing row contains (0e918961-eff8-423e-bf80-ca1f80e4cdcc, 314064f9-fb7e-44ea-ad95-d90775d93641, 1760464064773, system, null, null, null, null).',
[1]     hint: undefined,
[1]     position: undefined,
[1]     internalPosition: undefined,
[1]     internalQuery: undefined,
[1]     where: undefined,
[1]     schema: 'public',
[1]     table: 'chronicle',
[1]     column: 'title',
[1]     dataType: undefined,
[1]     constraint: undefined,
[1]     file: 'execMain.c',
[1]     line: '1982',
[1]     routine: 'ExecConstraints'
[1]   }
[1] }
[1] Failed to add chronicle entry: DrizzleQueryError: Failed query: insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"
[1] params: ac19c2c8-1ac4-4c01-ae5a-916583192730,314064f9-fb7e-44ea-ad95-d90775d93641,1760464064819,system
[1]     at NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:73:11)        
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]     at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]     ... 4 lines matching cause stack trace ...
[1]     at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20)
[1]     at async runBackgroundWorker (C:\replit\bg-godv\bg-godv\server\background-worker.ts:172:11) {
[1]   query: 'insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"',
[1]   params: [
[1]     'ac19c2c8-1ac4-4c01-ae5a-916583192730',
[1]     '314064f9-fb7e-44ea-ad95-d90775d93641',
[1]     1760464064819,
[1]     'system'
[1]   ],
[1]   cause: error: null value in column "title" of relation "chronicle" violates not-null constraint
[1]       at C:\replit\bg-godv\bg-godv\node_modules\pg-pool\index.js:45:11
[1]       at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:161:13)
[1]       at async NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:71:12)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]       at async Object.addChronicleEntry (C:\replit\bg-godv\bg-godv\server\storage.ts:123:21)
[1]       at async addChronicleEntry (C:\replit\bg-godv\bg-godv\src\services\chronicleService.ts:17:9)
[1]       at async persistAchievementUnlocks (C:\replit\bg-godv\bg-godv\src\services\achievementsService.ts:82:5)
[1]       at async processGameTick (C:\replit\bg-godv\bg-godv\src\ai\game-engine.ts:920:13)
[1]       at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20) {
[1]     length: 317,
[1]     severity: 'ERROR',
[1]     code: '23502',
[1]     detail: 'Failing row contains (ac19c2c8-1ac4-4c01-ae5a-916583192730, 314064f9-fb7e-44ea-ad95-d90775d93641, 1760464064819, system, null, null, null, null).',
[1]     hint: undefined,
[1]     position: undefined,
[1]     internalPosition: undefined,
[1]     internalQuery: undefined,
[1]     where: undefined,
[1]     schema: 'public',
[1]     table: 'chronicle',
[1]     column: 'title',
[1]     dataType: undefined,
[1]     constraint: undefined,
[1]     file: 'execMain.c',
[1]     line: '1982',
[1]     routine: 'ExecConstraints'
[1]   }
[1] }
[1] Failed to add chronicle entry: DrizzleQueryError: Failed query: insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"
[1] params: 9bad7cf2-f9b9-4c53-8092-102f64ebf667,314064f9-fb7e-44ea-ad95-d90775d93641,1760464064856,system
[1]     at NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:73:11)        
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]     at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]     ... 4 lines matching cause stack trace ...
[1]     at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20)
[1]     at async runBackgroundWorker (C:\replit\bg-godv\bg-godv\server\background-worker.ts:172:11) {
[1]   query: 'insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"',
[1]   params: [
[1]     '9bad7cf2-f9b9-4c53-8092-102f64ebf667',
[1]     '314064f9-fb7e-44ea-ad95-d90775d93641',
[1]     1760464064856,
[1]     'system'
[1]   ],
[1]   cause: error: null value in column "title" of relation "chronicle" violates not-null constraint
[1]       at C:\replit\bg-godv\bg-godv\node_modules\pg-pool\index.js:45:11
[1]       at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:161:13)
[1]       at async NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:71:12)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]       at async Object.addChronicleEntry (C:\replit\bg-godv\bg-godv\server\storage.ts:123:21)
[1]       at async addChronicleEntry (C:\replit\bg-godv\bg-godv\src\services\chronicleService.ts:17:9)
[1]       at async persistAchievementUnlocks (C:\replit\bg-godv\bg-godv\src\services\achievementsService.ts:82:5)
[1]       at async processGameTick (C:\replit\bg-godv\bg-godv\src\ai\game-engine.ts:920:13)
[1]       at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20) {
[1]     length: 317,
[1]     severity: 'ERROR',
[1]     code: '23502',
[1]     detail: 'Failing row contains (9bad7cf2-f9b9-4c53-8092-102f64ebf667, 314064f9-fb7e-44ea-ad95-d90775d93641, 1760464064856, system, null, null, null, null).',
[1]     hint: undefined,
[1]     position: undefined,
[1]     internalPosition: undefined,
[1]     internalQuery: undefined,
[1]     where: undefined,
[1]     schema: 'public',
[1]     table: 'chronicle',
[1]     column: 'title',
[1]     dataType: undefined,
[1]     constraint: undefined,
[1]     file: 'execMain.c',
[1]     line: '1982',
[1]     routine: 'ExecConstraints'
[1]   }
[1] }
[1] Failed to add chronicle entry: DrizzleQueryError: Failed query: insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"
[1] params: 502e59df-eade-48b4-a91d-9ec729d97d2e,314064f9-fb7e-44ea-ad95-d90775d93641,1760464064894,system
[1]     at NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:73:11)        
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]     at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]     ... 4 lines matching cause stack trace ...
[1]     at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20)
[1]     at async runBackgroundWorker (C:\replit\bg-godv\bg-godv\server\background-worker.ts:172:11) {
[1]   query: 'insert into "chronicle" ("id", "character_id", "timestamp", "type", "title", "description", "icon", "data") values ($1, $2, $3, $4, default, default, default, default) returning "id", "character_id", "timestamp", "type", "title", "description", "icon", "data"',
[1]   params: [
[1]     '502e59df-eade-48b4-a91d-9ec729d97d2e',
[1]     '314064f9-fb7e-44ea-ad95-d90775d93641',
[1]     1760464064894,
[1]     'system'
[1]   ],
[1]   cause: error: null value in column "title" of relation "chronicle" violates not-null constraint
[1]       at C:\replit\bg-godv\bg-godv\node_modules\pg-pool\index.js:45:11
[1]       at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:161:13)
[1]       at async NodePgPreparedQuery.queryWithCache (C:\replit\bg-godv\bg-godv\node_modules\src\pg-core\session.ts:71:12)
[1]       at async <anonymous> (C:\replit\bg-godv\bg-godv\node_modules\src\node-postgres\session.ts:154:19)
[1]       at async Object.addChronicleEntry (C:\replit\bg-godv\bg-godv\server\storage.ts:123:21)
[1]       at async addChronicleEntry (C:\replit\bg-godv\bg-godv\src\services\chronicleService.ts:17:9)
[1]       at async persistAchievementUnlocks (C:\replit\bg-godv\bg-godv\src\services\achievementsService.ts:82:5)
[1]       at async processGameTick (C:\replit\bg-godv\bg-godv\src\ai\game-engine.ts:920:13)
[1]       at async processCharacter (C:\replit\bg-godv\bg-godv\server\background-worker.ts:71:20) {
[1]     length: 317,
[1]     severity: 'ERROR',
[1]     code: '23502',
[1]     detail: 'Failing row contains (502e59df-eade-48b4-a91d-9ec729d97d2e, 314064f9-fb7e-44ea-ad95-d90775d93641, 1760464064894, system, null, null, null, null).',
[1]     hint: undefined,
[1]     position: undefined,
[1]     internalPosition: undefined,
[1]     internalQuery: undefined,
[1]     where: undefined,
[1]     schema: 'public',
[1]     table: 'chronicle',
[1]     column: 'title',
[1]     dataType: undefined,
[1]     constraint: undefined,
[1]     file: 'execMain.c',
[1]     line: '1982',
[1]     routine: 'ExecConstraints'
[1]   }
[1] }
[1] [Storage] Skipping duplicate event for character 314064f9-fb7e-44ea-ad95-d90775d93641: Получено достижение: Начало пути
[1] [Storage] Skipping duplicate event for character 314064f9-fb7e-44ea-ad95-d90775d93641: Получено достижение: Закаленный в боях
[1] [Storage] Skipping duplicate event for character 314064f9-fb7e-44ea-ad95-d90775d93641: Получено достижение: Путешественник
[1] [Storage] Skipping duplicate event for character 314064f9-fb7e-44ea-ad95-d90775d93641: Получено достижение: Убийца чудовищ
[1] [Background Worker] Валерона (314064f9-fb7e-44ea-ad95-d90775d93641): следующий тик (приключение) через 23с
[1] [Background Worker] Обработано 1 персонажей в этом цикле
[0]  POST /dashboard 200 in 12ms
[0]  POST /dashboard 200 in 26ms
[0]  POST /dashboard 200 in 9ms
[0]  POST /dashboard 200 in 7ms
[0]  POST /dashboard 200 in 15ms
[0]  POST /dashboard 200 in 9ms
[0]  POST /dashboard 200 in 10ms
[0]  POST /dashboard 200 in 7ms


[20:48:04]Не удалось купить предмет: Item data not found

