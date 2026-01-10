import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE } from "../enums.js";
import { createSchemaViewSprite } from "../sprite/schemaView.js";
import { EntityView } from "../sprite/entityView.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { getDirectionByName } from "./direction.js";
import { placeEntityOnMap, removeEntityFromMap } from "./map.js";
import { BuildingView } from "../sprite/buildingView.js";
import { ClientBattalionEntity } from "../entity/clientBattalionEntity.js";
import { ClientBuilding } from "../entity/clientBuilding.js";
import { Building } from "../entity/building.js";

export const despawnEntity = function(gameContext, entity) {
    const { teamManager, world } = gameContext;
    const { entityManager } = world;
    const entityID = entity.getID();

    removeEntityFromMap(gameContext, entity);

    entity.isMarkedForDestroy = true;
    entity.destroy();
    
    teamManager.broadcastEntityDeath(gameContext, entity);
    entityManager.destroyEntityByID(entityID);
}

export const createServerEntityObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { teamManager, typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entityID = entityManager.getNextID();
    const entityType = typeRegistry.getEntityType(typeID);
    const entityObject = new BattalionEntity(entityID);

    entityObject.loadConfig(entityType);
    entityObject.setTile(tileX, tileY);
    entityObject.setTeam(teamID);
    team.addEntity(entityObject);
    entityManager.addEntity(entityObject);

    return entityObject;
}

export const createClientEntityObject = function(gameContext, entityID, teamID, typeID, tileX, tileY) {
    const { teamManager, world, transform2D, spriteManager, typeRegistry } = gameContext;
    const { entityManager } = world;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const { colorID, color } = team;
    const entityType = typeRegistry.getEntityType(typeID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);
    const entityView = new EntityView(visualSprite, null, colorID, color);
    const entityObject = new ClientBattalionEntity(entityID, entityView);
    const spawnPosition = transform2D.transformTileToWorld(tileX, tileY);

    entityObject.loadConfig(entityType);
    entityObject.setPositionVec(spawnPosition);
    entityObject.setTile(tileX, tileY);
    entityObject.setTeam(teamID);
    entityObject.bufferSounds(gameContext);
    entityObject.bufferSprites(gameContext);
    team.addEntity(entityObject);
    entityManager.addEntity(entityObject);

    return entityObject;
}

export const spawnServerEntity = function(gameContext, config) {
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
    const entity = createServerEntityObject(gameContext, team, type, x, y);

    if(!entity) {
        return EntityManager.ID.INVALID;
    }

    const entityID = entity.getID();

    placeEntityOnMap(gameContext, entity);

    entity.setCustomID(id);
    entity.setCustomInfo(name, desc);

    if(direction !== null) {
        entity.setDirection(getDirectionByName(direction));
    }

    if(health > 0) {
        entity.setHealth(health);
    }

    if(stealth && entity.canCloak()) {
        entity.setFlag(BattalionEntity.FLAG.IS_CLOAKED);
    }
    
    return entityID;
}

export const spawnClientEntity = function(gameContext, config, externalID = EntityManager.ID.INVALID) {
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

    const { world } = gameContext;
    const { entityManager } = world;

    if(externalID === EntityManager.ID.INVALID) {
        externalID = entityManager.getNextID();
    }

    const entity = createClientEntityObject(gameContext, externalID, team, type, x, y);

    if(!entity) {
        return EntityManager.ID.INVALID;
    }

    const entityID = entity.getID();

    placeEntityOnMap(gameContext, entity);

    entity.setCustomID(id);
    entity.setCustomInfo(name, desc);

    if(direction !== null) {
        entity.setDirection(getDirectionByName(direction));
    }

    if(health > 0) {
        entity.setHealth(health);
    }

    if(stealth && entity.canCloak()) {
        entity.setFlag(BattalionEntity.FLAG.IS_CLOAKED);
        entity.setOpacity(0);
    }

    entity.playIdle(gameContext);

    return entityID;
}

export const spawnServerBuilding = function(gameContext, worldMap, config) {
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
        const buildingType = typeRegistry.getBuildingType(type);

        worldMap.createBuilding(x, y, (buildingID) => {
            const buildingObject = new Building(buildingID, buildingType);

            buildingObject.setCustomInfo(id, name, desc);
            buildingObject.setTile(gameContext, x, y);
            buildingObject.updateTeam(gameContext, team);

            return buildingObject;
        });
    }
}

export const spawnClientBuilding = function(gameContext, worldMap, config) {
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
        const buildingType = typeRegistry.getBuildingType(type);
        const { colorID, color } = teamObject;
        const { sprite } = buildingType;

        worldMap.createBuilding(x, y, (buildingID) => {
            const visualSprite = createSchemaViewSprite(gameContext, sprite, colorID, color, LAYER_TYPE.BUILDING);
            const buildingView = new BuildingView(visualSprite, sprite, colorID, color);
            const buildingObject = new ClientBuilding(buildingID, buildingType, buildingView);

            buildingObject.setCustomInfo(id, name, desc);
            buildingObject.setTile(gameContext, x, y);
            buildingObject.updateTeam(gameContext, team);

            return buildingObject;
        });
    }
}