import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { WorldMap } from "../../../engine/map/worldMap.js";
import { ACTION_TYPE, ENTITY_CATEGORY, TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { destroyEntity, destroyEntitySprite } from "../../systems/spawn.js";
import { playExplosion } from "../../systems/sprite.js";

const createExplodeTileIntent = function(layerID, tileX, tileY) {
    return new ActionIntent(ACTION_TYPE.EXPLODE_TILE, {
        "layerID": layerID,
        "tileX": tileX,
        "tileY": tileY
    });
}

const createExplodeTileData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "layer": WorldMap.INVALID_LAYER_ID,
        "tileX": WorldMap.OUT_OF_BOUNDS,
        "tileY": WorldMap.OUT_OF_BOUNDS
    }
}

const fillExplodeTilePlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { layerID, tileX, tileY } = actionIntent;
    const index = BattalionMap.getLayerIndex(layerID);

    if(index === WorldMap.INVALID_LAYER_ID) {
        return;
    }

    const entity = world.getEntityAt(tileX, tileY);
    let entityID = EntityManager.INVALID_ID;

    if(entity && entity.config.category !== ENTITY_CATEGORY.AIR) {
        entityID = entity.getID();
    }

    const data = createExplodeTileData();

    data.entityID = entityID;
    data.layer = index;
    data.tileX = tileX;
    data.tileY = tileY;

    executionPlan.setData(data);
}

const executeExplodeTile = function(gameContext, data) {
    const { world, isClient } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, tileX, tileY, layer } = data;
    const worldMap = mapManager.getActiveMap();

    if(entityID !== EntityManager.INVALID_ID) {
        const entity = entityManager.getEntity(entityID);

        if(isClient) {
            destroyEntitySprite(gameContext, entity);
        }

        destroyEntity(gameContext, entity);
    }

    worldMap.editTile(layer, tileX, tileY, TILE_ID.NONE);
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
    const { world } = gameContext;
    const { mapManager } = world;
    const { tileX, tileY } = data;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeLocalization(tileX, tileY);

    playExplosion(gameContext, tileX, tileY);
}

ExplodeTileAction.prototype.execute = function(gameContext, data) {
    executeExplodeTile(gameContext, data);
}

ExplodeTileAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    fillExplodeTilePlan(gameContext, executionPlan, actionIntent);
}