export const EntityHelper = {
    getTileEntity: function(gameContext, tileX, tileY) {
        const { world } = gameContext;
        const { entityManager, mapManager } = world;
        const activeMap = mapManager.getActiveMap();

        if(!activeMap) {
            return null;
        }

        const entityID = activeMap.getTopEntity(tileX, tileY);
        const entity = entityManager.getEntity(entityID);

        return entity;
    },
    getEntitiesInArea: function(gameContext, startX, startY, endX, endY) {
        const { world } = gameContext;
        const { entityManager, mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const entities = [];

        if(!worldMap) {
            return entities;
        }

        const entityIDs = worldMap.getAllEntitiesInArea(startX, startY, endX, endY);

        for(let i = 0; i < entityIDs.length; i++) {
            const entity = entityManager.getEntity(entityIDs[i]);

            if(entity) {
                entities.push(entity);
            }
        }
        
        return entities;
    },
    getUniqueEntitiesInArea: function(gameContext, startX, startY, endX, endY) {
        const { world } = gameContext;
        const { entityManager, mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const entities = [];

        if(!worldMap) {
            return entities;
        }

        const entityIDs = worldMap.getUniqueEntitiesInArea(startX, startY, endX, endY);

        for(const entityID of entityIDs) {
            const entity = entityManager.getEntity(entityID);

            if(entity) {
                entities.push(entity);
            }
        }

        return entities;
    },
    getEntitiesOwnedBy: function(gameContext, actorID) {
        const { world } = gameContext;
        const { entityManager, turnManager } = world;
        const actor = turnManager.getActor(actorID);
        const entities = [];

        if(!actor) {
            return entities;
        }

        for(const entityID of actor.entities) {
            const entity = entityManager.getEntity(entityID);

            if(entity) {
                entities.push(entity);
            }
        }

        return entities;
    }
};