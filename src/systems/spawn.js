import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE, TEAM_STAT } from "../enums.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";

const createEntity = function(gameContext, entityID, snapshot) {
    const { typeRegistry, world } = gameContext;
    const { entityManager } = world;
    const { teamID, type, tileX, tileY } = snapshot;
    const entityType = typeRegistry.getEntityType(type);
    const entityObject = new BattalionEntity(entityID, entityType);

    entityObject.loadConfig(gameContext, entityType);
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

export const createClientEntityObject = function(gameContext, entityID, snapshot) {
    const { teamManager, spriteController, soundController } = gameContext;
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
        spriteController.createEntitySprite(gameContext, entity);
        soundController.bufferUnitSounds(gameContext, entity.config.id);

        team.addToRoster(entity);
        entity.placeOnMap(gameContext);
        entity.syncRenderFlags();
    }

    return entity;
}

export const createServerEntityObject = function(gameContext, entityID, snapshot) {
    const { teamManager } = gameContext;
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