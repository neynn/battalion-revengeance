import { EntityManager } from "../../engine/entity/entityManager.js";

/**
 * 
 * @param {int} delta 
 * @returns {int}
 */
const getDamageFromDelta = function(delta) {
    if(delta >= 0) {
        return 0;
    }

    return -delta;
}

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

export const getDeadEntities = function(resolutions) {
    const deadEntities = [];

    for(const resolution of resolutions) {
        if(resolution.health === 0) {
            deadEntities.push(resolution.entityID);
        }
    }

    return deadEntities;
}

export const InteractionResolver = function() {
    this.resolutions = new Map();
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.resourceDamage = 0;
}

InteractionResolver.prototype.getDelta = function(entityID) {
    const delta = this.resolutions.get(entityID);

    if(delta === undefined) {
        return 0;
    }

    return delta;
}

InteractionResolver.prototype.addSelfDestruct = function(entity) {
    const entityID = entity.getID();

    //TODO(neyn): SELF_DESTRUCT is a rule override.
    //This should later be expanded upon!
    this.resolutions.set(entityID, -entity.health);
}

InteractionResolver.prototype.addSelfDamage = function(entity, damage) {
    //Self damage does not count towards total damage!
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));

    this.add(entityID, delta);
}

InteractionResolver.prototype.addHeal = function(entity, heal) {
    const entityID = entity.getID();
    const delta = entity.getHealDelta(heal, this.getDelta(entityID));

    this.totalHeal += delta;
    this.add(entityID, delta);
}

InteractionResolver.prototype.addAttack = function(entity, damage) {
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));
    const damageDealt = getDamageFromDelta(delta);
    const resourceDamage = entity.getDamageAsResources(damageDealt);

    this.totalDamage += damageDealt;
    this.resourceDamage += resourceDamage;
    this.add(entityID, delta);
}

InteractionResolver.prototype.add = function(entityID, delta) {
    if(this.resolutions.has(entityID)) {
        const total = this.resolutions.get(entityID);

        this.resolutions.set(entityID, total + delta);
    } else {
        this.resolutions.set(entityID, delta);
    }
}

InteractionResolver.prototype.createResolutions = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const resolutions = [];

    for(const [entityID, delta] of this.resolutions) {
        const entity = entityManager.getEntity(entityID);
        const health = entity.getHealthFromDelta(delta);
        let finalHealth = health;

        //Clamp health to uint.
        if(finalHealth < 0) {
            finalHealth = 0;
        }

        resolutions.push(fillEntityResolution(entityID, delta, health));
    }

    return resolutions;
}