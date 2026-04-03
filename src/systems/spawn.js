import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { bufferEntitySprites, createSchematicSprite, updateEntitySprite } from "./sprite.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { bufferEntitySounds } from "./sound.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";

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

const createBuilding = function(gameContext, worldMap, snapshot) {
    const { typeRegistry } = gameContext;
    const { teamID, type, tileX, tileY } = snapshot;
    const buildingType = typeRegistry.getBuildingType(type);
    const building = new Building(buildingType);

    building.setTile(tileX, tileY);
    building.setTeam(teamID);
    building.load(snapshot);

    if(worldMap.isBuildingPlaceable(tileX, tileY)) {
        worldMap.addBuilding(building);
    }

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

export const createClientBuildingObject = function(gameContext, worldMap, snapshot) {
    const { tileX, tileY, color } = snapshot;
    const building = createBuilding(gameContext, worldMap, snapshot);
    const spriteName = building.config.sprite;
    const position = transformTileToWorld(tileX, tileY);
    const visualSprite = createSchematicSprite(gameContext, spriteName, color, LAYER_TYPE.BUILDING);

    visualSprite.setPosition(position.x, position.y);
    building.spriteID = visualSprite.getIndex();

    return building;
}

export const createServerBuildingObject = function(gameContext, worldMap, snapshot) {
    return createBuilding(gameContext, worldMap, snapshot);
}

export const createMineObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const mineType = typeRegistry.getMineType(typeID);
    const mine = new Mine(mineType);

    mine.setTile(tileX, tileY);
    mine.setTeam(teamID);

    return mine;
}