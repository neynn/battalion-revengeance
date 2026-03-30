import { BattalionEntity } from "../entity/battalionEntity.js";
import { BUILDING_TYPE, LAYER_TYPE, SCHEMA_TYPE, TEAM_STAT } from "../enums.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { bufferEntitySprites, createSchematicSprite, updateEntitySprite } from "./sprite.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { bufferEntitySounds } from "./sound.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { TeamManager } from "../team/teamManager.js";

const getBuildingID = function(name) {
    const index = BUILDING_TYPE[name];

    if(index === undefined) {
        return BUILDING_TYPE.AIR_CONTROL;
    }

    return index;
}

const createEntity = function(gameContext, entityID, snapshot) {
    const { teamManager, typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const { teamID, type, tileX, tileY } = snapshot;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entityType = typeRegistry.getEntityType(type);
    const entityObject = new BattalionEntity(entityID);

    entityObject.loadConfig(entityType);
    entityObject.load(snapshot);
    entityObject.setTeam(teamID);
    entityObject.setTile(tileX, tileY);
    team.addEntity(entityObject);
    entityManager.addEntity(entityObject);
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
    const { typeRegistry } = gameContext;
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

export const createClientEntityObject = function(gameContext, entityID, snapshot) {
    const { teamManager, spriteManager, shadeCache } = gameContext;
    const { type, teamID } = snapshot;
    const entity = createEntity(gameContext, entityID, snapshot);

    if(!entity) {
        return null;
    }

    const { color } = teamManager.getTeam(teamID);
    const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);

    entity.spriteID = visualSprite.getIndex();

    bufferEntitySounds(gameContext, entity);
    bufferEntitySprites(gameContext, entity, color);
    updateEntitySprite(gameContext, entity);
    shadeCache.loadShades(gameContext, type);

    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        entity.setOpacity(0);
    }

    return entity;
}

export const createServerEntityObject = function(gameContext, entityID, snapshot) {
    return createEntity(gameContext, entityID, snapshot);
}

export const createClientBuildingObject = function(gameContext, teamID, typeID, tileX, tileY, color) {
    const building = createBuilding(gameContext, teamID, typeID, tileX, tileY);
    const { config } = building;
    const { sprite } = config;
    const position = transformTileToWorld(tileX, tileY);
    const visualSprite = createSchematicSprite(gameContext, sprite, color, LAYER_TYPE.BUILDING);

    visualSprite.setPosition(position.x, position.y);
    building.spriteID = visualSprite.getIndex();
    building.color = color;

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
        const building = createBuilding(gameContext, teamID, typeID, x, y);

        building.setCustomInfo(id, name, desc);
        worldMap.addBuilding(building);
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
        team = null,
        color = "NONE"
    } = config;

    const { teamManager } = gameContext;
    const teamID = teamManager.getTeamID(team);
    const isPlaceable = worldMap.isBuildingPlaceable(x, y);

    if(isPlaceable) {
        let buildingColor = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;

        if(teamID !== TeamManager.INVALID_ID) {
            const { color } = teamManager.getTeam(teamID);
    
            buildingColor = color;
        }

        const typeID = getBuildingID(type);
        const building = createClientBuildingObject(gameContext, teamID, typeID, x, y, buildingColor);

        building.setCustomInfo(id, name, desc);
        worldMap.addBuilding(building);
    }
}