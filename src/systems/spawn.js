import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { BUILDING_TYPE, DIRECTION, ENTITY_TYPE, LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { bufferEntitySprites, createSchematicSprite, updateEntitySprite } from "./sprite.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { bufferEntitySounds } from "./sound.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";

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

const createEntity = function(gameContext, entityID, teamID, typeID, tileX, tileY) {
    const { teamManager, typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entityType = typeRegistry.getEntityType(typeID);
    const entityObject = new BattalionEntity(entityID);

    entityObject.loadConfig(entityType);
    entityObject.setTeam(teamID);
    team.addEntity(entityObject);
    entityManager.addEntity(entityObject);
    entityObject.setTile(tileX, tileY);
    entityObject.placeOnMap(gameContext);

    return entityObject;
}

const destroyEntity = function(gameContext, entity) {
    const { teamManager, world } = gameContext;
    const { entityManager } = world;
    const { activeTeams } = teamManager;
    const team = entity.getTeam(gameContext);

    entity.removeFromMap(gameContext);
    entity.isMarkedForDestroy = true;
    
    team.addStatistic(TEAM_STAT.UNITS_LOST, 1);

    for(const teamID of activeTeams) {
        const team = teamManager.getTeam(teamID);

        team.onEntityDeath(entity);
    }

    entityManager.destroyEntity(entity.index);
    teamManager.updateStatus();
}

const createBuilding = function(gameContext, teamID, typeID, tileX, tileY) {
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

export const despawnClientEntity = function(gameContext, entity) {
    const { spriteManager } = gameContext;

    spriteManager.destroySprite(entity.spriteID);
    entity.spriteID = SpriteManager.INVALID_ID;
    destroyEntity(gameContext, entity);
}

export const despawnServerEntity = function(gameContext, entity) {
    destroyEntity(gameContext, entity);
}

export const createClientEntityObject = function(gameContext, entityID, teamID, typeID, tileX, tileY) {
    const { teamManager, spriteManager, shadeCache } = gameContext;
    const entity = createEntity(gameContext, entityID, teamID, typeID, tileX, tileY);

    if(!entity) {
        return null;
    }

    const { schema } = teamManager.getTeam(teamID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);

    entity.spriteID = visualSprite.getIndex();

    bufferEntitySounds(gameContext, entity);
    bufferEntitySprites(gameContext, entity, schema);
    updateEntitySprite(gameContext, entity);
    shadeCache.loadShades(gameContext, typeID);

    return entity;
}

export const createServerEntityObject = function(gameContext, entityID, teamID, typeID, tileX, tileY) {
    return createEntity(gameContext, entityID, teamID, typeID, tileX, tileY);
}

export const createServerBuildingObject = function(gameContext, teamID, typeID, tileX, tileY) {
    return createBuilding(gameContext, teamID, typeID, tileX, tileY);
}

export const createClientBuildingObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { teamManager } = gameContext;
    const building = createBuilding(gameContext, teamID, typeID, tileX, tileY);

    if(!building) {
        return null;
    }

    const { schema } = teamManager.getTeam(teamID);
    const { config } = building;
    const { sprite } = config;

    const position = transformTileToWorld(tileX, tileY);
    const visualSprite = createSchematicSprite(gameContext, sprite, schema, LAYER_TYPE.BUILDING);

    building.spriteID = visualSprite.getIndex();
    visualSprite.setPosition(position.x, position.y);

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

    entity.setCustomInfo(id, name, desc);

    if(direction !== null) {
        entity.setDirection(DIRECTION[direction] ?? DIRECTION.EAST);
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
        updateEntitySprite(gameContext, entity);

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