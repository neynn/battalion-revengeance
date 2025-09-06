import { Inventory } from "../actors/player/inventory/inventory.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { EntityHealEvent } from "../events/entityHeal.js";
import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the healing of entities.
 */
export const HealSystem = function() {}

HealSystem.DEFAULT_HEAL_COST = 100;
HealSystem.HEAL_RESOURCE = "Supplies";

/**
 * Returns the heal cost of an entity based on its missing health.
 * 
 * @param {*} entity 
 * @param {int} missingHealth 
 * @returns {int}
 */
HealSystem.getSuppliesRequired = function(entity, missingHealth) {
    const costPerPoint = entity.config.healCost ?? HealSystem.DEFAULT_HEAL_COST;
    const supplyCost = missingHealth * costPerPoint;

    return supplyCost;
}

/**
 * Returns a bool which determines if the actor has enough to heal.
 * 
 * @param {*} actor 
 * @param {int} value 
 * @returns 
 */
HealSystem.hasEnoughResources = function(actor, value) {
    if(value === 0) {
        return true;
    }

    const { inventory } = actor;

    if(!inventory) {
        return false;
    }

    return inventory.has(Inventory.TYPE.RESOURCE, HealSystem.HEAL_RESOURCE, value);
}

/**
 * Checks if an entity can be healed by an actor. The actor needs to own the entity and have enough resources.
 * 
 * @param {*} entity 
 * @param {*} actor 
 * @returns {boolean} 
 */
HealSystem.isEntityHealableBy = function(entity, actor) {
    const entityID = entity.getID();

    if(!actor.hasEntity(entityID) || entity.isFull()) {
        return false;
    }

    const missingHealth = entity.getMissingHealth();
    const requiredSupplies = HealSystem.getSuppliesRequired(entity, missingHealth);
    const hasEnoughResources = HealSystem.hasEnoughResources(actor, requiredSupplies);

    return hasEnoughResources;
}

/**
 * Heals an entity for the specified amount and emits the ENTITY_HEAL event.
 * 
 * @param {*} gameContext 
 * @param {int} entityID
 * @param {string} actorID
 * @param {int} health 
 */
HealSystem.healEntity = function(gameContext, entityID, actorID, health) {
    const { world } = gameContext;
    const { eventBus, entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        entity.addHealth(health);
        entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        eventBus.emit(ArmyEventHandler.TYPE.ENTITY_HEAL, EntityHealEvent.createEvent(entityID, health));
    }
}