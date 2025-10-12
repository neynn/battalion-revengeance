import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { CounterAttackAction } from "./counterAttackAction.js";

export const AttackAction = function() {
    Action.call(this);
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, actionData, actionID) {
    const { attackers, target } = actionData;

    AttackSystem.startAttack(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

AttackAction.prototype.onEnd = function(gameContext, actionData, actionID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { actorID, attackers, target } = actionData;
    const { id, state } = target;

    AttackSystem.updateTarget(gameContext, target, actorID, ArmyEventHandler.KILL_REASON.ATTACK);
    AnimationSystem.playIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        actionQueue.addImmediateRequest(CounterAttackAction.createRequest(id, attackers));
    }
}

AttackAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

AttackAction.prototype.validate = function(gameContext, request) {
    const { entityID, actorID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackerEntities = AttackSystem.getAttackersForActor(gameContext, target, actorID);

    if(attackerEntities.length === 0) {
        return null;
    }

    const targetObject = AttackSystem.createTargetObject(target, attackerEntities);
    const attackerIDs = attackerEntities.map(entity => entity.getID());
    
    return {
        "actorID": actorID,
        "attackers": attackerIDs,
        "target": targetObject
    }
}

AttackAction.createRequest = function(actorID, entityID) {
    const request = new ActionRequest(ACTION_TYPE.ATTACK, {
        "actorID": actorID,
        "entityID": entityID
    });
    
    return request;
}