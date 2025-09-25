import { getRandomElement, getRandomEnumKey } from "../../engine/math/math.js";
import { BattalionEntity } from "./battalionEntity.js";
import { BattalionSprite } from "./battalionSprite.js";


export const EntitySpawner = {
    createEntityConfig: function(type, tileX, tileY, direction) {
        return {
            "x": tileX,
            "y": tileY,
            "type": type,
            "direction": direction
        };
    },
    getRandomEntityType: function(gameContext) {
        const { world } = gameContext;
        const { entityManager } = world;
        const entities = Object.keys(entityManager.entityTypes);

        return getRandomElement(entities);
    },
    createEntity: function(gameContext, config) {
        const { world, transform2D } = gameContext;
        const { entityManager } = world;
        const { id, type, x, y, direction } = config;
        const entity = entityManager.createEntity((entityID, entityType) => {
            const entitySprite = new BattalionSprite();
            const entityObject = new BattalionEntity(entityID, entitySprite);

            entityObject.setConfig(entityType);
            entityObject.setDirectionByName(direction);

            const schemaID = getRandomEnumKey(BattalionSprite.SCHEMA);
            const spriteID = entityObject.getSpriteID();
            const spawnPosition = transform2D.transformTileToWorld(x, y);

            entitySprite.create(gameContext, spriteID, schemaID);
            entityObject.setTile(x, y);
            entityObject.setPosition(spawnPosition);
            entityObject.loadTraits();

            return entityObject;
        }, type, id);
    
        if(entity) {
            EntitySpawner.placeEntity(gameContext, entity);
        }

        return entity;
    },
    destroyEntity: function(gameContext, entityID) {
        const { world } = gameContext;
        const { entityManager } = world;
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            EntitySpawner.removeEntity(gameContext, entity);
            entity.destroy();
        }
    },
    placeEntity: function(gameContext, entity) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const sizeX = entity.config.dimX ?? 1;
            const sizeY = entity.config.dimY ?? 1;
            const entityID = entity.getID();

            worldMap.addEntity(entity.tileX, entity.tileY, sizeX, sizeY, entityID);
        }
    },
    removeEntity: function(gameContext, entity) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const sizeX = entity.config.dimX ?? 1;
            const sizeY = entity.config.dimY ?? 1;
            const entityID = entity.getID();

            worldMap.removeEntity(entity.tileX, entity.tileY, sizeX, sizeY, entityID);
        }
    },
    debugEntities: function(gameContext) {
        for(let i = 0; i < 1; i++) {
            for(let j = 0; j < 1; j++) {
                const config = EntitySpawner.createEntityConfig(EntitySpawner.getRandomEntityType(gameContext), j, i);
                const entity = EntitySpawner.createEntity(gameContext, config);

                console.log(config, entity);
            }
        }
    }
};