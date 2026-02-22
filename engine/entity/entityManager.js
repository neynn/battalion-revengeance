export const EntityManager = function() {
    this.nextID = 0;
    this.entities = [];
    this.entityMap = new Map();
    this.flags = EntityManager.FLAG.NONE;
}

EntityManager.FLAG = {
    NONE: 0,
    DO_UPDATES: 1 << 0
};

EntityManager.INVALID_ID = -1;

EntityManager.prototype.exit = function() {
    this.nextID = 0;
    this.entities.length = 0;
    this.entityMap.clear();
}

EntityManager.prototype.hasEntity = function(entityID) {
    return this.entityMap.has(entityID);
}

EntityManager.prototype.forEachEntity = function(onCall) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];

        if(!entity.isMarkedForDestroy) {
            onCall(entity);
        }
    }
}

EntityManager.prototype.cleanup = function() {
    for(let i = this.entities.length - 1; i >= 0; i--) {
        if(this.entities[i].isMarkedForDestroy) {
            this.destroyEntity(i);
        }
    }
}

EntityManager.prototype.update = function(gameContext) {
    if(this.flags & EntityManager.FLAG.DO_UPDATES) {
        for(let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];

            if(entity.isMarkedForDestroy) {
                this.destroyEntity(i);
            } else {
                entity.update(gameContext);
            }
        }
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined || index < 0 || index >= this.entities.length) {
        return null;
    }

    const entity = this.entities[index];
    const targetID = entity.getID();

    if(entityID === targetID) {
        if(!entity.isMarkedForDestroy) {
            return entity;
        } else {
            return null;
        }
    }

    for(let i = 0; i < this.entities.length; ++i) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.entityMap.set(entityID, i);

            if(!entity.isMarkedForDestroy) {
                return entity;
            } else {
                return null;
            }
        }
    }

    return null;
}

EntityManager.prototype.getNextID = function() {
    return this.nextID++;
}

EntityManager.prototype.addEntity = function(entity) {
    const entityID = entity.getID();

    if(entityID !== EntityManager.INVALID_ID && !this.entityMap.has(entityID)) {
        this.entityMap.set(entityID, this.entities.length);
        this.entities.push(entity);
    }
}

EntityManager.prototype.destroyEntity = function(index) {
    const swapEntityIndex = this.entities.length - 1;
    const swapEntity = this.entities[swapEntityIndex];
    const swapEntityID = swapEntity.getID();
    const entity = this.entities[index];
    const entityID = entity.getID();

    this.entityMap.set(swapEntityID, index);
    this.entityMap.delete(entityID);
    this.entities[index] = this.entities[swapEntityIndex];
    this.entities.pop();
}

EntityManager.prototype.destroyEntityByID = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index !== undefined) {
        this.destroyEntity(index);
    }
}