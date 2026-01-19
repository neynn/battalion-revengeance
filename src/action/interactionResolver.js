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
    this.add(entity.getID(), damage, entity.getHealthAfterDamage(damage));
    this.totalDamage += damage;
    this.resourceDamage += Math.floor(entity.getDamageAsResources(damage));
}

InteractionResolver.prototype.add = function(entityID, delta, health) {
    this.hitEntities.push({
        "entityID": entityID,
        "delta": delta,
        "health": health
    });
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