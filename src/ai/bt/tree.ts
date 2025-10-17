import type { Blackboard, ActionLike, Node } from "./types";
import { SelectorNode, ConditionNode, UtilityPickNode, LeafActionNode } from "./types";

export function buildBehaviorTree(params: {
  combatActions: ActionLike[];
  deadActions: ActionLike[];
  arrivalActions: ActionLike[];
  nightActions: ActionLike[]; // quest/rest/travel
  idleActions: ActionLike[];
  travelAction: ActionLike;
  arrivalWindowMs: number;
  stallWindowMs: number;
}): Node {
  const isDead = (bb: Blackboard) => bb.character.status === 'dead';
  const inCombat = (bb: Blackboard) => bb.character.status === 'in-combat';
  const isArrivalWindow = (bb: Blackboard) => {
    const t = bb.character.lastLocationArrival || 0;
    return (Date.now() - t) <= params.arrivalWindowMs && !bb.character.hasCompletedLocationActivity;
  };
  const isNightNpcClosed = (bb: Blackboard) => !bb.worldState.timeOfDayEffect.npcAvailability;
  const isStalled = (bb: Blackboard) => {
    const history = Array.isArray(bb.character.actionHistory) ? bb.character.actionHistory : [];
    const lastTs = history.length > 0 ? (history[history.length - 1]?.timestamp || 0) : (bb.character.lastUpdatedAt || bb.character.createdAt || 0);
    return (Date.now() - (lastTs || 0)) > params.stallWindowMs;
  };

  const combatPick = new UtilityPickNode(params.combatActions);
  const deadPick = new UtilityPickNode(params.deadActions);
  const arrivalPick = new UtilityPickNode(params.arrivalActions);
  const nightPick = new UtilityPickNode(params.nightActions, params.travelAction);
  const idlePick = new UtilityPickNode(params.idleActions);
  const forceTravel = new LeafActionNode(params.travelAction);

  // Root selector evaluates first matching child that yields an action
  return new SelectorNode([
    new ConditionNode(inCombat, combatPick, 'InCombat'),
    new ConditionNode(isDead, deadPick, 'IsDead'),
    new ConditionNode(isArrivalWindow, arrivalPick, 'ArrivalWindow'),
    new ConditionNode(isNightNpcClosed, nightPick, 'NpcClosed'),
    idlePick,
    new ConditionNode(isStalled, forceTravel, 'Stalled'),
  ]);
}


