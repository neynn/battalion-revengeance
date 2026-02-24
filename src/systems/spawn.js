import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { BUILDING_TYPE, ENTITY_TYPE, LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { createSchemaViewSprite, SchemaView } from "../sprite/schemaView.js";
import { getDirectionByName } from "./direction.js";
import { ClientBattalionEntity } from "../entity/clientBattalionEntity.js";
import { ClientBuilding } from "../entity/clientBuilding.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";

const getEntityID = function(name) {
    const index = ENTITY_TYPE[name];

    if(index === undefined) {
        return ENTITY_TYPE._INVALID;
    }

    return index;
}

const getBuildingID = function(name) {
    const index = BUILDING_TYPE[name];

    if(index === undefined) {
        return BUILDING_TYPE.AIR_CONTROL;
    }

    return index;
}

export const despawnClientEntity = function(gameContext, entity) {
    
}

export const despawnEntity = function(gameContext, entity) {
    const { teamManager, world } = gameContext;
    const { entityManager } = world;
    const { activeTeams } = teamManager;
    const entityID = entity.getID();
    const team = entity.getTeam(gameContext);

    entity.removeFromMap(gameContext);
    entity.isMarkedForDestroy = true;
    entity.onDestroy();
    
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

    const { schema } = team;
    const entityType = typeRegistry.getEntityType(typeID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);
    const entityView = new SchemaView(visualSprite, null);
    const entityObject = new ClientBattalionEntity(entityID, entityView);
    const spawnPosition = transform2D.transformTileToWorld(tileX, tileY);

    entityView.schema = schema;

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

export const createServerBuildingObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { teamManager, typeRegistry } = gameContext;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const buildingType = typeRegistry.getBuildingType(typeID);
    const building = new Building(buildingType);

    building.setTile(tileX, tileY);
    building.setTeam(teamID);

    return building;
}

export const createClientBuildingObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { teamManager, typeRegistry, transform2D } = gameContext;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const buildingType = typeRegistry.getBuildingType(typeID);

    const { schema } = team;
    const { sprite } = buildingType;

    const position = transform2D.transformTileToWorld(tileX, tileY);
    const visualSprite = createSchemaViewSprite(gameContext, sprite, schema, LAYER_TYPE.BUILDING);
    const buildingView = new SchemaView(visualSprite, sprite);
    const building = new ClientBuilding(buildingType, buildingView);

    buildingView.schema = schema;
    buildingView.setPositionVec(position);

    building.setTile(tileX, tileY);
    building.setTeam(teamID);

    return building;
}

export const createMineObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const mineType = typeRegistry.getMineType(typeID);
    const mine = new Mine(mineType);

    mine.setTile(tileX, tileY);
    mine.setTeam(teamID);

    return mine;
}

const parseEntityJSON = function(gameContext, json, entityID, createEntity) {
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
        stealth = false,
        cash = 0
    } = json;

    const { teamManager } = gameContext;
    const teamID = teamManager.getTeamID(team);
    const typeID = getEntityID(type);
    const entity = createEntity(gameContext, entityID, teamID, typeID, x, y);

    if(!entity) {
        return null;
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
        entity.setCloaked();
    }

    entity.addCash(cash);

    return entity;
}

export const spawnServerEntity = function(gameContext, config, entityID) {
    const entity = parseEntityJSON(gameContext, config, entityID, createServerEntityObject);

    if(entity) {
        //Post-Parsing
    }
}

export const spawnClientEntity = function(gameContext, config, externalID = EntityManager.INVALID_ID) {
    const { world } = gameContext;
    const { entityManager } = world;

    if(externalID === EntityManager.INVALID_ID) {
        externalID = entityManager.getNextID();
    }

    const entity = parseEntityJSON(gameContext, config, externalID, createClientEntityObject);

    if(entity) {
        entity.playIdle(gameContext);

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            entity.setOpacity(0);
        }
    }
}

export const spawnServerBuilding = function(gameContext, worldMap, config) {
    const {
        id = null,
        name = null,
        desc = null,
        x = -1,
        y = -1,
        type = "NONE",
        team = null
    } = config;

    const { teamManager } = gameContext;
    const teamID = teamManager.getTeamID(team);
    const isPlaceable = worldMap.isBuildingPlaceable(x, y);

    if(isPlaceable) {
        const typeID = getBuildingID(type);
        const building = createServerBuildingObject(gameContext, teamID, typeID, x, y);

        if(building) {
            building.setCustomInfo(id, name, desc);
            worldMap.addBuilding(building);
        }
    }
}

export const spawnClientBuilding = function(gameContext, worldMap, config) {
    const {
        id = null,
        name = null,
        desc = null,
        x = -1,
        y = -1,
        type = "NONE",
        team = null
    } = config;

    const { teamManager } = gameContext;
    const teamID = teamManager.getTeamID(team);
    const isPlaceable = worldMap.isBuildingPlaceable(x, y);

    if(isPlaceable) {
        const typeID = getBuildingID(type);
        const building = createClientBuildingObject(gameContext, teamID, typeID, x, y);

        if(building) {
            building.setCustomInfo(id, name, desc);
            worldMap.addBuilding(building);
        }
    }
}