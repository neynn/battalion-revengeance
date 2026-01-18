import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { BUILDING_TYPE, LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { createSchemaViewSprite } from "../sprite/schemaView.js";
import { EntityView } from "../sprite/entityView.js";
import { getDirectionByName } from "./direction.js";
import { BuildingView } from "../sprite/buildingView.js";
import { ClientBattalionEntity } from "../entity/clientBattalionEntity.js";
import { ClientBuilding } from "../entity/clientBuilding.js";
import { Building } from "../entity/building.js";

export const despawnEntity = function(gameContext, entity) {
    const { teamManager, world } = gameContext;
    const { entityManager } = world;
    const { activeTeams } = teamManager;
    const entityID = entity.getID();
    const team = entity.getTeam(gameContext);

    entity.removeFromMap(gameContext);
    entity.isMarkedForDestroy = true;
    entity.destroy();
    
    team.addStatistic(TEAM_STAT.UNITS_LOST, 1);

    for(const teamID of activeTeams) {
        const team = teamManager.getTeam(teamID);

        team.onEntityDeath(entity);
    }

    entityManager.destroyEntityByID(entityID);
    teamManager.updateStatus();
}

export const createServerEntityObject = function(gameContext, entityID, teamID, typeID, tileX, tileY) {
    const { teamManager, typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entityType = typeRegistry.getEntityType(typeID);
    const entityObject = new BattalionEntity(entityID);

    entityObject.loadConfig(entityType);
    entityObject.setTile(tileX, tileY);
    entityObject.setTeam(teamID);
    team.addEntity(entityObject);
    entityManager.addEntity(entityObject);
    entityObject.placeOnMap(gameContext);

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
    entityObject.placeOnMap(gameContext);

    return entityObject;
}

export const spawnServerEntity = function(gameContext, config, entityID) {
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
    const entity = createServerEntityObject(gameContext, entityID, team, type, x, y);

    if(!entity) {
        return;
    }

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
        type = BUILDING_TYPE.AIR_CONTROL,
        team = null
    } = config;

    const teamObject = teamManager.getTeam(team);

    if(teamObject) {
        const isPlaceable = worldMap.isBuildingPlaceable(x, y);

        if(isPlaceable) {
            const buildingType = typeRegistry.getBuildingType(type);
            const building = new Building(buildingType);

            building.setCustomInfo(id, name, desc);
            building.setTile(gameContext, x, y);
            building.updateTeam(gameContext, team);

            worldMap.addBuilding(building);
        }
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
        type = BUILDING_TYPE.AIR_CONTROL,
        team = null
    } = config;

    const teamObject = teamManager.getTeam(team);

    if(teamObject) {
        const isPlaceable = worldMap.isBuildingPlaceable(x, y);

        if(isPlaceable) {
            const buildingType = typeRegistry.getBuildingType(type);
            const { colorID, color } = teamObject;
            const { sprite } = buildingType;
            const visualSprite = createSchemaViewSprite(gameContext, sprite, colorID, color, LAYER_TYPE.BUILDING);
            const buildingView = new BuildingView(visualSprite, sprite, colorID, color);
            const building = new ClientBuilding(buildingType, buildingView);

            building.setCustomInfo(id, name, desc);
            building.setTile(gameContext, x, y);
            building.updateTeam(gameContext, team);
            
            worldMap.addBuilding(building);
        }
    }
}