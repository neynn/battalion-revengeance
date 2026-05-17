import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { bufferEntitySprites, updateEntitySprite } from "./sprite.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { bufferEntitySounds } from "./sound.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";

const createEntity = function(gameContext, entityID, snapshot) {
    const { typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const { teamID, type, tileX, tileY } = snapshot;
    const entityType = typeRegistry.getEntityType(type);
    const entityObject = new BattalionEntity(entityID);

    entityObject.loadConfig(entityType);
    entityObject.load(snapshot);
    entityObject.setTeam(teamID);
    entityObject.setTile(tileX, tileY);
    entityManager.addEntity(entityObject);
    
    return entityObject;
}

export const killEntity = function(gameContext, entity) {
    const { teamManager, world } = gameContext;
    const { entityManager } = world;
    const { activeTeams } = teamManager;
    const team = entity.getTeam(gameContext);

    entity.removeFromMap(gameContext);
    entityManager.removeHot(entity.index);
    team.addStatistic(TEAM_STAT.UNITS_LOST, 1);

    for(const teamID of activeTeams) {
        const team = teamManager.getTeam(teamID);

        team.onEntityDeath(entity);
    }
}

export const destroyEntitySprite = function(gameContext, entity) {
    const { spriteManager } = gameContext;

    spriteManager.destroySprite(entity.spriteID);
    entity.spriteID = SpriteManager.INVALID_ID;
}

export const createClientEntityObject = function(gameContext, entityID, snapshot) {
    const { teamManager, spriteManager, shadeCache } = gameContext;
    const { type, teamID } = snapshot;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entity = createEntity(gameContext, entityID, snapshot);

    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        entity.setOpacity(0);
    }

    if(!entity.isDead()) {
        const { color } = teamManager.getTeam(teamID);
        const visualSprite = spriteManager.createEmptySprite(LAYER_TYPE.LAND);
    
        entity.spriteID = visualSprite.getIndex();
    
        bufferEntitySounds(gameContext, entity);
        bufferEntitySprites(gameContext, entity, color);
        updateEntitySprite(gameContext, entity);
        shadeCache.loadShades(gameContext, type);

        team.addToRoster(entity);
        entity.placeOnMap(gameContext);
    }

    return entity;
}

export const createServerEntityObject = function(gameContext, entityID, snapshot) {
    const { teamManager, spriteManager, shadeCache } = gameContext;
    const { type, teamID } = snapshot;
    const team = teamManager.getTeam(teamID);

    if(!team) {
        return null;
    }

    const entity = createEntity(gameContext, entityID, snapshot);

    if(!entity.isDead()) {
        team.addToRoster(entity);
        entity.placeOnMap(gameContext);
    }

    return entity;
}

export const createMineObject = function(gameContext, teamID, typeID, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const mineType = typeRegistry.getMineType(typeID);
    const mine = new Mine(mineType);

    mine.tileX = tileX;
    mine.tileY = tileY;
    mine.teamID = teamID;

    return mine;
}