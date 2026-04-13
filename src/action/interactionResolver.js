import { EntityManager } from "../../engine/entity/entityManager.js";

export const createEntityResolution = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "delta": 0,
        "health": 0
    }
}

export const fillEntityResolution = function(entityID, delta, health) {
    const resolution = createEntityResolution();

    resolution.entityID = entityID;
    resolution.delta = delta;
    resolution.health = health;

    return resolution;
}

export const InteractionResolver = function() {
    this.hitEntities = [];
    this.deadEntities = [];
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.resourceDamage = 0;
}

InteractionResolver.prototype.addHeal = function(entity, heal) {
    this.add(entity.getID(), heal, entity.getHealthAfterHeal(heal));
    this.totalHeal += heal;
}

InteractionResolver.prototype.addAttack = function(entity, damage) {
    this.add(entity.getID(), damage, entity.getHealthAfterAttack(damage));
    this.totalDamage += damage;
    this.resourceDamage += Math.floor(entity.getDamageAsResources(damage));
}

InteractionResolver.prototype.add = function(entityID, delta, health) {
    this.hitEntities.push(fillEntityResolution(entityID, delta, health));
}

InteractionResolver.prototype.getDeadEntities = function() {
    this.deadEntities.length = 0;

    for(let i = 0; i < this.hitEntities.length; i++) {
        const { entityID, health } = this.hitEntities[i];

        if(health <= 0) {
            this.deadEntities.push(entityID);
        }
    }

    return this.deadEntities;
}

InteractionResolver.prototype.getHitEntities = function() {
    return this.hitEntities;
}