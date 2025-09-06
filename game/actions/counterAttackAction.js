import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterAttackAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

CounterAttackAction.prototype.onStart = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.startAttack(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

CounterAttackAction.prototype.onEnd = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.updateTarget(gameContext, target, null, ArmyEventHandler.KILL_REASON.ATTACK);
    AnimationSystem.playIdle(gameContext, attackers);
}

CounterAttackAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterAttackAction.prototype.getValidated = function(gameContext, template) {
    const { entityID } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const counterTarget = entity.getAttackCounterTarget(gameContext);

    if(!counterTarget) {
        return null;
    }

    const attackerIDs = [entity].map(entity => entity.getID());
    const targetObject = AttackSystem.createTargetObject(counterTarget, [entity]);
    
    return {
        "attackers": attackerIDs,
        "target": targetObject
    }
}

CounterAttackAction.createRequest = function(entityID, attackers) {
    const request = new ActionRequest(ACTION_TYPE.COUNTER_ATTACK, {
        "entityID": entityID,
        "attackers": attackers
    });

    return request;
}