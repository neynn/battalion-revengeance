import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { WorldMap } from "../../../engine/map/worldMap.js";
import { ACTION_TYPE, ENTITY_CATEGORY, TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { killEntity } from "../../systems/spawn.js";
import { playExplosion } from "../../systems/sprite.js";

const createExplodeTileIntent = function(tileX, tileY) {
    return new ActionIntent(ACTION_TYPE.EXPLODE_TILE, {
        "tileX": tileX,
        "tileY": tileY
    });
}

const createExplodeTileData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "tileX": WorldMap.OUT_OF_BOUNDS,
        "tileY": WorldMap.OUT_OF_BOUNDS
    }
}

const fillExplodeTilePlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { tileX, tileY } = actionIntent;
    const entity = world.getEntityAt(tileX, tileY);
    let entityID = EntityManager.INVALID_ID;

    if(entity && entity.config.category !== ENTITY_CATEGORY.AIR) {
        entityID = entity.getID();
    }

    const data = createExplodeTileData();

    data.entityID = entityID;
    data.tileX = tileX;
    data.tileY = tileY;

    executionPlan.setData(data);
}

const executeExplodeTile = function(gameContext, data) {
    const { teamManager, world, tileManager, typeRegistry } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, tileX, tileY } = data;
    const worldMap = mapManager.getActiveMap();

    if(entityID !== EntityManager.INVALID_ID) {
        const entity = entityManager.getEntity(entityID);

        entity.setHealth(0);

        killEntity(gameContext, entity);
    }

    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = worldMap.getTile(layerID, tileX, tileY);
        const logicalID = tileManager.getLogicalID(typeID);
        const { canExplode } = typeRegistry.getTileType(logicalID);

        if(canExplode) {
            worldMap.setTile(TILE_ID.NONE, layerID, tileX, tileY);
        }
    }

    teamManager.updateStatus();
}

export const ExplodeTileVTable = {
    createIntent: createExplodeTileIntent,
    createData: createExplodeTileData,
    fillPlan: fillExplodeTilePlan,
    execute: executeExplodeTile
};

export const ExplodeTileAction = function() {
    Action.call(this);
}

ExplodeTileAction.prototype = Object.create(Action.prototype);
ExplodeTileAction.prototype.constructor = ExplodeTileAction;

ExplodeTileAction.prototype.onStart = function(gameContext, data) {
    const { world, spriteController } = gameContext;
    const { mapManager, entityManager } = world;
    const { entityID, tileX, tileY } = data;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeLocalization(tileX, tileY);

    playExplosion(gameContext, tileX, tileY);

    if(entityID !== EntityManager.INVALID_ID) {
        const entity = entityManager.getEntity(entityID);

        spriteController.destroyEntitySprite(gameContext, entity);
    }
}