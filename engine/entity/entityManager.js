import { EventEmitter } from "../events/eventEmitter.js";

export const EntityManager = function() {
    this.nextID = 0;
    this.entities = [];
    this.entityMap = new Map();
    this.entityTypes = new Map();

    this.events = new EventEmitter();
    this.events.register(EntityManager.EVENT.ENTITY_CREATE);
    this.events.register(EntityManager.EVENT.ENTITY_DESTROY);
}

EntityManager.EVENT = {
    ENTITY_CREATE: "ENTITY_CREATE",
    ENTITY_DESTROY: "ENTITY_DESTROY"
};

EntityManager.ID = {
    INVALID: -1
};

EntityManager.prototype.load = function() {}

EntityManager.prototype.addEntityType = function(typeID, type) {
    this.entityTypes.set(typeID, type);
}

EntityManager.prototype.getEntityType = function(typeID) {
    const entityType = this.entityTypes.get(typeID);

    if(!entityType) {
        return null;
    }

    return entityType;
}

EntityManager.prototype.exit = function() {
    this.events.muteAll();
    this.entityMap.clear();
    this.entities.length = 0;
    this.nextID = 0;
}

EntityManager.prototype.forEachEntity = function(onCall) {
    if(typeof onCall === "function") {
        for(let i = 0; i < this.entities.length; ++i) {
            onCall(this.entities[i]);
        }
    }
}

EntityManager.prototype.update = function(gameContext) {
    for(let i = this.entities.length - 1; i >= 0; i--) {
        const entity = this.entities[i];

        if(entity.isMarkedForDestroy) {
            this.destroyEntity(i);
        } else {
            entity.update(gameContext);
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
        }
    }

    for(let i = 0; i < this.entities.length; ++i) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.entityMap.set(entityID, i);

            if(!entity.isMarkedForDestroy) {
                return entity;
            }
        }
    }

    return null;
}

EntityManager.prototype.createEntity = function(onCreate, typeID, externalID) {
    const entityID = externalID !== undefined ? externalID : this.nextID++;

    if(!this.entityMap.has(entityID)) {
        const entityType = this.getEntityType(typeID);

        if(entityType) {
            const entity = onCreate(entityID, entityType);

            if(entity) {
                this.entityMap.set(entityID, this.entities.length);
                this.entities.push(entity);
                this.events.emit(EntityManager.EVENT.ENTITY_CREATE, {
                    "id": entityID,
                    "entity": entity
                });

                return entity;
            }
        }
    }

    return null;
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
    this.events.emit(EntityManager.EVENT.ENTITY_DESTROY, {
        "id": entityID
    });
}