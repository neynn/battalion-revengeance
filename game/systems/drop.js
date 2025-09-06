import { getRandomChance } from "../../engine/math/math.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { DefaultTypes } from "../defaultTypes.js";
import { DEBRIS_TYPE } from "../enums.js";
import { DropEvent } from "../events/drop.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const DropSystem = function() {}

DropSystem.DROP_TYPE = {
    HIT: 0,
    KILL: 1,
    SELL: 2
};

const getDropList = function(rewards) {
    const drops = [];

    for(let i = 0; i < rewards.length; i++) {
        const { type, id, value, chance = 100 } = rewards[i];
        const randomRoll = getRandomChance();

        if(chance >= randomRoll) {
            const drop = DefaultTypes.createItemTransaction(type, id, value);

            drops.push(drop);
        }
    }

    return drops;
}

const getRewards = function(entity, dropType) {
    switch(dropType) {
        case DropSystem.DROP_TYPE.HIT: return entity.config.hitRewards;
        case DropSystem.DROP_TYPE.KILL: return entity.config.killRewards;
        case DropSystem.DROP_TYPE.SELL: return entity.config.sell ? [entity.config.sell] : null;
        default: return null;
    }
}

DropSystem.createProductionDrop = function(gameContext, entity, actorID) {
    const { world } = gameContext;
    const { eventBus } = world;
    const productionComponent = entity.getComponent(ArmyEntity.COMPONENT.PRODUCTION);

    if(productionComponent) {
        const rewards = productionComponent.getRewards(gameContext, entity);

        if(rewards) {
            const drops = getDropList(rewards);

            if(drops.length !== 0) {
                const { x, y } = entity.getCenterTile();

                eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, x, y));
            }
        }
    }
}

DropSystem.createEntityDrop = function(gameContext, entity, dropType, actorID) {
    const { world } = gameContext;
    const { eventBus } = world;
    const rewards = getRewards(entity, dropType);

    if(rewards) {
        const drops = getDropList(rewards);

        if(drops.length !== 0) {
            const { x, y } = entity.getCenterTile();

            eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, x, y));
        }
    }
}

DropSystem.createDebrisDrop = function(gameContext, actorID, tileX, tileY) {
    const { world } = gameContext;
    const { eventBus } = world;
    const debrisType = gameContext.getDebrisType(DEBRIS_TYPE.DEBRIS);

    if(debrisType) {
        const { clearRewards } = debrisType;
        const drops = getDropList(clearRewards);

        if(drops.length !== 0) {
            eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, tileX, tileY));
        }
    }
}