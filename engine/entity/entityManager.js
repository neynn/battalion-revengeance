export const EntityManager = function() {
    this.nextID = 0;
    this.entities = [];
    this.openSlots = [];
    this.entityMap = new Map();
    this.flags = EntityManager.FLAG.NONE;
}

EntityManager.FLAG = {
    NONE: 0,
    DO_UPDATES: 1 << 0
};

EntityManager.INVALID_INDEX = -1;
EntityManager.INVALID_ID = -1;

EntityManager.prototype.exit = function() {
    this.nextID = 1000;
    this.entities.length = 0;
    this.openSlots.length = 0;
    this.entityMap.clear();
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
        const entity = this.entities[i];

        if(entity.isMarkedForDestroy) {
            const entityID = entity.getID();

            this.entityMap.delete(entityID);
        } else {
            this.entities.length = i + 1;
            break;
        }
    }
}

EntityManager.prototype.update = function(gameContext) {
    if(this.flags & EntityManager.FLAG.DO_UPDATES) {
        for(let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];

            if(!entity.isMarkedForDestroy) {
                entity.update(gameContext);
            }
        }

        this.cleanup();
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined) {
        return null;
    }

    return this.getEntityByIndex(index);
}

EntityManager.prototype.getEntityByIndex = function(index) {
    if(index < 0 || index >= this.entities.length) {
        return null;
    }

    const entity = this.entities[index];

    if(entity.isMarkedForDestroy) {
        return null;
    }

    return entity;
}

EntityManager.prototype.getNextID = function() {
    return this.nextID++;
}

EntityManager.prototype.addEntity = function(entity) {
    const entityID = entity.getID();

    if(entityID !== EntityManager.INVALID_ID && !this.entityMap.has(entityID)) {
        let index = EntityManager.INVALID_INDEX;

        if(this.openSlots.length === 0) {
            index = this.entities.length;
            this.entities.push(entity);
        } else {
            index = this.openSlots.pop();
            this.entities[index] = entity;
        }

        this.entityMap.set(entityID, index);
        entity.index = index;
    }
}

EntityManager.prototype.destroyEntity = function(index) {
    if(index < 0 || index >= this.entities.length) {
        return;
    }

    const entity = this.entities[index];
    const entityID = entity.getID();

    this.entityMap.delete(entityID);

    //Always remove the trailing entity but keep any other.
    if(index === this.entities.length) {
        this.entities.pop();
    } else {
        entity.isMarkedForDestroy = true;
        entity.index = EntityManager.INVALID_INDEX;
        this.openSlots.push(index);
    }
}