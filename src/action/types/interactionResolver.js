export const InteractionResolver = function() {
    this.hitEntities = [];
    this.deadEntities = [];
    this.totalDamage = 0;
    this.totalHeal = 0;
}

InteractionResolver.prototype.addHeal = function(entity, heal) {
    this.add(entity.getID(), entity.getHealthAfterHeal(heal));
    this.totalHeal += heal;
}

InteractionResolver.prototype.addAttack = function(entity, damage) {
    this.add(entity.getID(), entity.getHealthAfterDamage(damage));
    this.totalDamage += damage;
}

InteractionResolver.prototype.add = function(entityID, health) {
    this.hitEntities.push({
        "entityID": entityID,
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