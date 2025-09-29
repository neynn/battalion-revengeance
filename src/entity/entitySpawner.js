import { getRandomElement } from "../../engine/math/math.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { BattalionEntity } from "./battalionEntity.js";
import { BattalionSprite } from "./battalionSprite.js";

const getRandomEntityType = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entities = Object.keys(entityManager.entityTypes);

    return getRandomElement(entities);
}

export const EntitySpawner = {
    createEntityConfig: function(type, tileX, tileY, direction) {
        return {
            "x": tileX,
            "y": tileY,
            "type": type,
            "direction": direction
        };
    },
    getOwnersOf: function(gameContext, entityID) {
        const { world } = gameContext;
        const { turnManager } = world;
        const owners = [];

        turnManager.forAllActors((actor) => {
            const hasEntity = actor.hasEntity(entityID);

            if(hasEntity) {
                owners.push(actor);
            }
        });

        return owners;
    },
    createEntity: function(gameContext, config, colorID, color) {
        const { world, transform2D } = gameContext;
        const { entityManager } = world;
        const { id, type, x, y, direction } = config;

        const entity = entityManager.createEntity((entityID, entityType) => {
            const entitySprite = new BattalionSprite();
            const entityObject = new BattalionEntity(entityID, entitySprite);

            entityObject.setConfig(entityType);
            entityObject.setDirectionByName(direction);

            const spriteID = entityObject.getSpriteID();
            const spawnPosition = transform2D.transformTileToWorld(x, y);

            entitySprite.init(gameContext, spriteID, colorID, color);
            entityObject.setTile(x, y);
            entityObject.setPosition(spawnPosition);
            entityObject.loadTraits();

            return entityObject;
        }, type, id);

        return entity;
    },
    destroyEntity: function(gameContext, entityID) {
        const { world, teamManager } = gameContext;
        const { entityManager } = world;
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            EntitySpawner.removeEntity(gameContext, entity);
            teamManager.onEntityDeath(gameContext, entity);
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
    spawnEntity: function(gameContext, entityConfig, ownerID) {
        const { world, teamManager } = gameContext;
        const { turnManager } = world;
        const actor = turnManager.getActor(ownerID);

        if(actor) {
            const { teamID } = actor;
            const team = teamManager.getTeam(teamID);

            if(team) {
                const { colorID, color } = team;
                const entity = EntitySpawner.createEntity(gameContext, entityConfig, colorID, color);

                if(entity) {
                    const entityID = entity.getID();
                    const isExpendable = entity.hasTrait(TypeRegistry.TRAIT_TYPE.INERTIAL);

                    EntitySpawner.placeEntity(gameContext, entity);
                    entity.setTeam(teamID);
                    actor.addEntity(entityID);

                    if(!isExpendable) {
                        team.addEntity(entityID);
                    }

                    return entity;
                }
            }
        }

        return null;
    },
    debugEntities: function(gameContext, ownerID) {
        for(let i = 0; i < 1; i++) {
            for(let j = 0; j < 1; j++) {
                const entityType = getRandomEntityType(gameContext);
                const config = EntitySpawner.createEntityConfig(entityType, j, i);
                const entity = EntitySpawner.spawnEntity(gameContext, config, ownerID);

                console.log(config, entity);
            }
        }
    }
};