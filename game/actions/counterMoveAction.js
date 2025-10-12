import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterMoveAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onStart = function(gameContext, actionData, actionID) {
    const { attackers, target } = actionData;

    AttackSystem.startAttack(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

CounterMoveAction.prototype.onEnd = function(gameContext, actionData, actionID) {
    const { attackers, target } = actionData;
    
    AttackSystem.updateTarget(gameContext, target, null, ArmyEventHandler.KILL_REASON.ATTACK);
    AnimationSystem.playIdle(gameContext, attackers);
}

CounterMoveAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterMoveAction.prototype.validate = function(gameContext, template) {
    const { entityID } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackers = target.getMoveCounterAttackers(gameContext);

    if(attackers.length === 0) {
        return null;
    }
    
    const attackerIDs = attackers.map(entity => entity.getID());
    const targetObject = AttackSystem.createTargetObject(target, attackers);
    
    return {
        "attackers": attackerIDs,
        "target": targetObject
    }
}

CounterMoveAction.createRequest = function(entityID) {
    const request = new ActionRequest(ACTION_TYPE.COUNTER_MOVE, {
        "entityID": entityID
    });

    return request;
}