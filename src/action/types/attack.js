import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { FIXED_DELTA_TIME } from "../../../engine/engine_constants.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, ATTACK_TYPE, ATTACK_COMMAND_TYPE, SOUND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { CombatSystem, InteractionResolver, ResolutionSystem } from "../../systems/combat.js";
import { playEntitySound } from "../../systems/sound.js";
import { getAnimationDuration, playAttackEffect, updateEntitySprite } from "../../systems/sprite.js";
import { DeathActionVTable } from "./death.js";

const ATTACK_FLAG = {
    NONE: 0,
    INITIATE: 1 << 0,
    COUNTER: 1 << 1,
    UNCLOAK: 1 << 2,
    BEWEGUNGSKRIEG: 1 << 3
};

const createAttackData = function() {
    return {
        "attackerID": EntityManager.INVALID_ID,
        "targetID": EntityManager.INVALID_ID,
        "resolutions": [],
        "resourceDamage": 0,
        "flags": ATTACK_FLAG.NONE
    }
}

const createAttackIntent = function(entityID, targetID, command) {
    return new ActionIntent(ACTION_TYPE.ATTACK, {
        "entityID": entityID,
        "targetID": targetID,
        "command": command
    });
}

const executeAttack = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackerID, targetID, resolutions, flags, resourceDamage } = data;
    const entity = entityManager.getEntity(attackerID);
    const target = entityManager.getEntity(targetID);
    const team = entity.getTeam(gameContext);
    const doTerrifying = entity.hasTrait(TRAIT_TYPE.TERRIFYING) && !(flags & ATTACK_FLAG.COUNTER);
    let killedUnits = 0;

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);

        if(entityID !== attackerID) {
            if(doTerrifying) {
                targetObject.reduceMorale();
            }

            //TODO(neyn): Should the unit itself count as killed?
            if(health <= 0) {
                killedUnits++;
            }
        }
    }

    if(flags & ATTACK_FLAG.UNCLOAK) {
        entity.setUncloaked();
    }

    if(flags & ATTACK_FLAG.COUNTER) {
        entity.clearLastAttacker();
    } else {
        target.setLastAttacker(attackerID);
        entity.consumeAct();

        if(flags & ATTACK_FLAG.BEWEGUNGSKRIEG) {
            entity.triggerBewegungskrieg();
        }
    }

    team.addStatistic(TEAM_STAT.UNITS_KILLED, killedUnits);
    team.addStatistic(TEAM_STAT.RESOURCE_DAMAGE, resourceDamage);
}

const fillAttackPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, command } = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    const resolver = new InteractionResolver();
    let flags = ATTACK_FLAG.NONE;

    switch(command) {
        case ATTACK_COMMAND_TYPE.DIRECT: {
            if(entity.isAllowedToActAndMove()) {
                CombatSystem.resolveFirstAttack(gameContext, entity, target, resolver);
            }

            break;
        }
        case ATTACK_COMMAND_TYPE.FOLLOW_UP: {
            if(entity.hasMoved() && entity.isAllowedToAct() && entity.isNextToEntity(target)) {
                CombatSystem.resolveFirstAttack(gameContext, entity, target, resolver);
            }

            break;
        }
        case ATTACK_COMMAND_TYPE.COUNTER: {
            CombatSystem.resolveCounterAttack(gameContext, entity, target, resolver);
            flags |= ATTACK_FLAG.COUNTER;
            break;
        }
    }

    const resolutions = resolver.createResolutions(gameContext);

    if(resolutions.length !== 0) {
        const deadEntities = ResolutionSystem.getDeadEntities(resolutions);

        if(deadEntities.length !== 0) {
            executionPlan.addNext(DeathActionVTable.createIntent(deadEntities));
        }               

        if(command !== ATTACK_COMMAND_TYPE.COUNTER) {
            if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                flags |= ATTACK_FLAG.UNCLOAK;
            } 

            if(deadEntities.length !== 0) {
                if(entity.hasTrait(TRAIT_TYPE.BEWEGUNGSKRIEG)) {
                    flags |= ATTACK_FLAG.BEWEGUNGSKRIEG;
                }
            }
        }

        executionPlan.addNext(createAttackIntent(targetID, entityID, ATTACK_COMMAND_TYPE.COUNTER));

        const data = createAttackData();

        data.attackerID = entityID;
        data.targetID = targetID;
        data.resolutions = resolutions;
        data.resourceDamage = Math.floor(resolver.resourceDamage);
        data.flags = flags;

        executionPlan.setData(data);
    }
}

export const AttackActionVTable = {
    createIntent: createAttackIntent,
    createData: createAttackData,
    fillPlan: fillAttackPlan,
    execute: executeAttack
};

export const AttackAction = function() {
    Action.call(this);

    this.duration = 0;
    this.passedTime = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackerID, targetID, resolutions, flags } = data;
    const entity = entityManager.getEntity(attackerID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);
    entity.setState(BattalionEntity.STATE.FIRE);

    if(flags & ATTACK_FLAG.COUNTER) {
        //TODO: Special counter anim!
    }

    updateEntitySprite(gameContext, entity);
    playEntitySound(gameContext, entity, SOUND_TYPE.FIRE);
    playAttackEffect(gameContext, entity, target, resolutions);

    if(flags & ATTACK_FLAG.UNCLOAK) {
        entity.setOpacity(1);
    }

    this.duration = getAnimationDuration(gameContext, entity);
}

AttackAction.prototype.onUpdate = function(gameContext, data) {
    this.passedTime += FIXED_DELTA_TIME;
}
 
AttackAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.passedTime >= this.duration;
}

AttackAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackerID } = data;
    const entity = entityManager.getEntity(attackerID);

    entity.setState(BattalionEntity.STATE.IDLE);
    updateEntitySprite(gameContext, entity);

    this.duration = 0;
    this.passedTime = 0;
}