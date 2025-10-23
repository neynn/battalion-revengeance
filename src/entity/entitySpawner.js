import { getRandomElement } from "../../engine/math/math.js";
import { EntitySprite } from "../sprite/entitySprite.js";
import { SchemaSprite } from "../sprite/schemaSprite.js";
import { TeamSpawner } from "../team/teamSpawner.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { BattalionEntity } from "./battalionEntity.js";
import { Building } from "./building.js";

const getRandomEntityType = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entities = Object.keys(entityManager.entityTypes);

    return getRandomElement(entities);
}

export const EntitySpawner = {
    createSpawnConfig: function(id, type, tileX, tileY) {
        return {
            "id": id,
            "type": type,
            "x": tileX,
            "y": tileY
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
        const { world, transform2D, spriteManager } = gameContext;
        const { entityManager } = world;
        const { id, type, x, y } = config;

        const entity = entityManager.createEntity((entityID, entityType) => {
            const visualSprite = spriteManager.createEmptySprite(TypeRegistry.LAYER_TYPE.LAND);
            const entitySprite = new EntitySprite(visualSprite, null, colorID, color);
            const entityObject = new BattalionEntity(entityID, entitySprite);
            const spawnPosition = transform2D.transformTileToWorld(x, y);

            entityObject.loadConfig(entityType);
            entityObject.setTile(x, y);
            entityObject.setPositionVec(spawnPosition);

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
            const sizeX = entity.config.dimX;
            const sizeY = entity.config.dimY;
            const entityID = entity.getID();

            worldMap.addEntity(entity.tileX, entity.tileY, sizeX, sizeY, entityID);
        }
    },
    removeEntity: function(gameContext, entity) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        if(worldMap) {
            const sizeX = entity.config.dimX;
            const sizeY = entity.config.dimY;
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
    loadEntity: function(gameContext, config, customID, externalID) {
        const { 
            x = -1,
            y = -1,
            type = null,
            owner = null,
            direction = null,
            name = null,
            desc = null,
            health = -1
        } = config;
        const ownerID = TeamSpawner.getActorID(gameContext, owner);
        const spawnConfig = EntitySpawner.createSpawnConfig(externalID, type, x, y);
        const entity = EntitySpawner.spawnEntity(gameContext, spawnConfig, ownerID);

        if(entity) {
            entity.bufferSounds(gameContext);
            entity.bufferSprites(gameContext);
            entity.setCustomInfo(customID, name, desc);

            if(direction !== null) {
                entity.setDirection(BattalionEntity.DIRECTION[direction]);
            }

            if(health !== -1) {
                entity.setHealth(health);
            }

            entity.playIdle(gameContext);
            entity.onInitialPlace(gameContext);
        }

        return entity;
    },
    loadBuilding: function(gameContext, worldMap, config, name) {
        const { typeRegistry, teamManager } = gameContext;
        const { x = -1, y = -1, type = TypeRegistry.BUILDING_TYPE.AIR_CONTROL, team = null } = config;
        const teamType = teamManager.getTeam(team);

        if(teamType) {
            const { colorID, color } = teamType;

            worldMap.createBuilding(x, y, () => {
                const buildingType = typeRegistry.getType(type, TypeRegistry.CATEGORY.BUILDING);
                const { sprite } = buildingType;
                const visualSprite = SchemaSprite.createVisual(gameContext, sprite, colorID, color, TypeRegistry.LAYER_TYPE.BUILDING);
                const buildingSprite = new SchemaSprite(visualSprite, sprite, colorID, color);
                const building = new Building(name, buildingType, buildingSprite);

                building.setTile(gameContext, x, y);
                building.setTeam(team);

                return building;
            });
        }
    }
};