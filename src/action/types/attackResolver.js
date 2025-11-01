export const AttackResolver = function() {
    this.hitEntities = [];
    this.deadEntities = [];
}

AttackResolver.prototype.add = function(entityID, health) {
    this.hitEntities.push({
        "entityID": entityID,
        "health": health
    });
}

AttackResolver.prototype.getDeadEntities = function() {
    this.deadEntities.length = 0;

    for(let i = 0; i < this.hitEntities.length; i++) {
        const { entityID, health } = this.hitEntities[i];

        if(health <= 0) {
            this.deadEntities.push(entityID);
        }
    }

    return this.deadEntities;
}

AttackResolver.prototype.getHitEntities = function() {
    return this.hitEntities;
}