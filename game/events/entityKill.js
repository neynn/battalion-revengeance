import { ArmyEventHandler } from "../armyEventHandler.js";
import { OBJECTIVE_TYPE } from "../enums.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";
import { EntityDeathEvent } from "./entityDeath.js";

export const EntityKillEvent = function() {}

EntityKillEvent.prototype = Object.create(ArmyEvent.prototype);
EntityKillEvent.prototype.constructor = EntityKillEvent;

EntityKillEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus, entityManager, turnManager } = world;

    const { entityID, reason, actorID } = event;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        const player = turnManager.getActor(actorID);

        if(player && player.missions) {
            const entityType = entity.config.id;

            player.missions.onObjective(OBJECTIVE_TYPE.DESTROY, entityType, 1);
        }
        
        DropSystem.createEntityDrop(gameContext, entity, DropSystem.DROP_TYPE.KILL, actorID);
        eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, EntityDeathEvent.createEvent(entityID, reason));
    }
}

EntityKillEvent.createEvent = function(entityID, actorID, damage, reason) {
    return {
        "entityID": entityID,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}