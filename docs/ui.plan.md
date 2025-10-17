# AI Direction: Where we are and what to change

## What we have now

- **Style**: Utility AI with rule-based base weights + modifiers.
- **Selection**: `determineNextAction` → reflexes → filter `idleActions` → score via `priority-engine` (config rules, profile, fatigue, modifiers, learning) → top action. There’s also a simple fallback policy.
- **Data**: `WorldState` snapshot; `Action { canPerform, getWeight?, perform }` leaves; some anti-stall heuristics and arrival boosts.
- **Not GOAP**: No precondition/effect graph search/planning; decisions are one-step weighted choices.

## Recommendation

Adopt a **hybrid Behavior Tree (BT) + Utility Picker**:

- Use a small BT for high-level arbitration and guards (contexts, gates, watchdogs).
- Inside each leaf selection, reuse our existing utility scoring to pick among relevant actions. This keeps actions pluggable and reduces “stupidity” by design.

## Proposed Tree (high-level)

- Root Selector
- Reflex Selector (flee, potions)
- If `status === 'dead'` → Sovngarde subtree
- If `status === 'in-combat'` → Combat subtree
- City Arrival Gate (≤5 min and not completed activity) → UtilityPick(takeQuest, rest, trade, social)
- Night Gate (NPC unavailable) → UtilityPick(quest, rest, travel) with forced travel if no quest
- Idle Selector → UtilityPick(all remaining idle actions)
- StallGuard → Force Travel/Rest if idle > X min

## How this helps

- Deterministic guards prevent loops (e.g., at night in city with no quests, we don’t spam thoughts — we travel/rest).
- Utility layer remains for nuanced choice within a context (we keep `getWeight`, profiles, fatigue, learning).
- Each gate/leaf is a **replaceable block** (easy to swap logic when behavior is poor).

## Incremental Implementation Plan

### Step 1: Introduce BT scaffolding

- New: `src/ai/bt/types.ts` (`Blackboard`, `Node`, `Selector`, `Sequence`, `Condition`, `Leaf`, `UtilityPickNode`).
- New: `src/ai/bt/tree.ts` build the tree described above with our existing actions.
- Adapt `determineNextAction` to evaluate the BT and return an action.

### Step 2: Extract context gates

- CityArrivalGate, NightGate, StallGuard nodes reading existing fields: `lastLocationArrival`, `hasCompletedLocationActivity`, `timeOfDayEffect.npcAvailability`, idle duration from `actionHistory`.
- Remove ad-hoc gates from `brain.ts` since BT now owns them.

### Step 3: Keep Utility scorer as-is, but wrap it

- `UtilityPickNode(actions, blackboard)` calls current `priority-engine` with the provided subset.
- Ensure we continue recording decision traces and learning.

### Step 4: Config and tuning

- Add env/config toggles: `NEXT_PUBLIC_AI_BT=true` to switch BT on/off.
- Expose gate durations (arrival window mins, stall window mins) in `src/ai/config/constants.ts`.

### Step 5: Diagnostics

- Extend `/api/ai/inspect` to render current BT path taken (list of nodes passed/failed) alongside existing utility trace.

### Step 6: Optional micro-GOAP node (later)

- For targeted goals (e.g., “ensure ≥3 healing potions”), add a small GOAP planner as a BT leaf that composes buy/travel steps when needed. This can be introduced without touching the rest of the tree.

## Files to touch

- Update: `src/ai/brain.ts` (use BT entry, delete inline gates that move into BT)
- Reuse: `src/ai/priority-engine.ts` (no change to interface)
- New: `src/ai/bt/{types.ts, tree.ts}`
- Update: `src/ai/config/constants.ts` (BT toggles and gate timeouts)
- Update: `src/app/api/ai/inspect/route.ts` (optional: include BT trace)

## Rollout

- Guard with feature flag (on dev first).
- If BT off: current behavior unchanged.
- If BT on: expect fewer idle loops and clearer, testable decision points.