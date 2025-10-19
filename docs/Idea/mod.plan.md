# AI Node Editor → Auto‑RPG Mechanics

### North‑Star

Make the graph not just an editor but the hero’s “build”: players hot‑swap decision logic (within limits) to pursue goals (gold, fame, questing), while auto‑play continues safely when they’re offline.

### Node Palette (additions)

- Sensors: Time/Day, NearbyEnemy, Relationship(NPC), Reputation(Faction), QuestState, Economy(Price/Shop), Travel(PathCost), Inventory(Weight/Gold), Crafting(HasIngredients), Danger(Level), Event(Urgent)
- Memory/Blackboard: KeyValue(Read/Write), Counter(inc/dec), Cooldown(Read/Set), SuccessRate(rolling)
- Evaluators: Utility(Weighted), SoftmaxSelector, RiskReward(expected_gain, survival), Bandit(epsilon/thompson), Knapsack(looting), PathPick(shortest/safest)
- Decorators/Gates: If, Probability, OncePerDay, Cooldown, Sequence, Selector, Retry, Timeout, Inverter, Succeeder
- Actions: Travel(to id), StartQuest(template/tag), ProgressQuest, Combat(Stance: flee/normal/aggressive), Heal(UsePotion), Eat, Sleep, Trade(Buy/Sell by tag/ratio), Craft(RecipeId/Auto), Donate(Faction), Social(Talk/Trade/Steal), Learn(Spell/Perk)

### Player‑Facing Mechanics

- Divine Influence: limited points/day to edit graph or toggle templates; higher tiers unlock advanced nodes
- Templates: share/fork/rate; “Loadout” per activity (questing, farming, crafting)
- Simulation (sandbox): run N ticks with seed → see outcome deltas; A/B compare two graphs
- Challenges: node‑constraints quests (e.g., no Heal node; win 3 combats); rewards unlock nodes/skins

### Analytics & UX

- Live overlays: per‑edge flow rate, node success %, expected value; heatmap mode
- Diagnostics stream: SSE already added—extend payload with node timings and chosen actions
- Inspector: per‑node config with presets; tooltips/examples; catalog search

### Safety & Economy

- Limits: max nodes/edges, per‑tick budget, cooldowns; deny exploit loops (e.g., infinite buy/sell)
- Costs: edits consume influence; rare nodes require achievements (crafting a “logic chip” item)

### Rollout Steps

1) Core nodes: If, Cooldown, Probability, Travel, Heal, Trade, Craft; Memory: KV, Counter
2) Template CRUD UI + per‑character activation
3) Simulation runner (server) with seed + result diff; simple report panel
4) Influence system: daily budget; audit log; undo history
5) Analytics overlay: node hit rate, chosen action stream
6) Expand to Bandit/Knapsack/PathPick; add quest/social nodes

### Minimal Data Changes

- Add `ai_graph_influence(characterId, dailyBudget, spent, resetAt)` (Drizzle)
- Node runtime KV store per character: `ai_graph_state(characterId, json)` with TTL’d cooldowns

### Risks

- Balance drift: gate advanced nodes, server‑side limits
- Complexity: presets/recipes and templates help non‑experts