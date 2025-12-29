import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Building } from "../entity/building.js";
import { LAYER_TYPE } from "../enums.js";
import { EntitySprite } from "../sprite/entitySprite.js";
import { SchemaSprite } from "../sprite/schemaSprite.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { getDirectionByName } from "./direction.js";
import { placeEntityOnMap, removeEntityFromMap } from "./map.js";

const createEntityObject = function(gameContext, config, colorID, color) {
    const { world, transform2D, spriteManager, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { id, type, x, y } = config;
    const entityType = typeRegistry.getEntityType(type);

    const entity = entityManager.createEntity((entityID) => {
        const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);
        const entitySprite = new EntitySprite(visualSprite, null, colorID, color);
        const entityObject = new BattalionEntity(entityID, entitySprite);
        const spawnPosition = transform2D.transformTileToWorld(x, y);

        entityObject.loadConfig(entityType);
        entityObject.setPositionVec(spawnPosition);
        entityObject.setTile(x, y);

        return entityObject;
    }, id);

    return entity;
}

export const createSpawnConfig = function(id, type, tileX, tileY) {
    return {
        "id": id,
        "type": type,
        "x": tileX,
        "y": tileY
    };
}

export const createEntityFromConfig = function(gameContext, config, teamID) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(teamID);

    if(team) {
        const { colorID, color } = team;
        const entity = createEntityObject(gameContext, config, colorID, color);

        if(entity) {
            team.addEntity(entity);
            entity.setTeam(teamID);
            entity.bufferSounds(gameContext);
            entity.bufferSprites(gameContext);

            return entity;
        } 
    }

    return null;
}

export const despawnEntity = function(gameContext, entity) {
    const { teamManager } = gameContext;

    removeEntityFromMap(gameContext, entity);
    teamManager.broadcastEntityDeath(gameContext, entity);
    entity.destroy();
}

export const spawnEntityFromJSON = function(gameContext, config, externalID = EntityManager.ID.INVALID) {
    const { 
        x = -1,
        y = -1,
        id = null,
        name = null,
        desc = null,
        type = null,
        team = null,
        direction = null,
        health = -1,
        stealth = false
    } = config;
    const spawnConfig = createSpawnConfig(externalID, type, x, y);
    const entity = createEntityFromConfig(gameContext, spawnConfig, team);

    if(entity) {
        placeEntityOnMap(gameContext, entity);

        entity.setCustomInfo(id, name, desc);

        if(direction !== null) {
            entity.setDirection(getDirectionByName(direction));
        }

        if(health > 0) {
            entity.setHealth(health);
        }

        if(stealth && entity.canCloak()) {
            entity.cloakInstant();
        }

        entity.playIdle(gameContext);
    }

    return entity;
}

export const spawnBuildingFromJSON = function(gameContext, worldMap, config) {
    const { typeRegistry, teamManager } = gameContext;
    const {
        id = null,
        name = null,
        desc = null,
        x = -1,
        y = -1,
        type = TypeRegistry.BUILDING_TYPE.AIR_CONTROL,
        team = null
    } = config;

    const teamObject = teamManager.getTeam(team);

    if(teamObject) {
        const { colorID, color } = teamObject;
        const buildingType = typeRegistry.getBuildingType(type);
        const { sprite } = buildingType;

        worldMap.createBuilding(x, y, (buildingID) => {
            const visualSprite = SchemaSprite.createVisual(gameContext, sprite, colorID, color, LAYER_TYPE.BUILDING);
            const buildingSprite = new SchemaSprite(visualSprite, sprite, colorID, color);
            const buildingObject = new Building(buildingID, buildingType, buildingSprite);

            buildingObject.setCustomInfo(id, name, desc);
            buildingObject.setTile(gameContext, x, y);
            buildingObject.updateTeam(gameContext, team);

            return buildingObject;
        });
    }
}