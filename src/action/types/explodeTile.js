import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { WorldMap } from "../../../engine/map/worldMap.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { playExplosion } from "../../systems/sprite.js";

export const ExplodeTileAction = function(despawn) {
    Action.call(this);

    this._despawn = despawn;
}

ExplodeTileAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "layer": WorldMap.INVALID_LAYER_ID,
        "tileX": WorldMap.OUT_OF_BOUNDS,
        "tileY": WorldMap.OUT_OF_BOUNDS
    }
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

ExplodeTileAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

ExplodeTileAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

ExplodeTileAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, tileX, tileY, layer } = data;
    const worldMap = mapManager.getActiveMap();

    if(entityID !== EntityManager.INVALID_ID) {
        const entity = entityManager.getEntity(entityID);

        this._despawn(gameContext, entity);
    }

    worldMap.editTile(layer, tileX, tileY, TILE_ID.NONE);
}

ExplodeTileAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { layerID, tileX, tileY } = actionIntent;
    const index = BattalionMap.getLayerIndex(layerID);

    if(index === WorldMap.INVALID_LAYER_ID) {
        return;
    }

    const entity = world.getEntityAt(tileX, tileY);
    let entityID = EntityManager.INVALID_ID;

    if(entity) {
        entityID = entity.getID();
    }

    const data = ExplodeTileAction.createData();

    data.entityID = entityID;
    data.layer = index;
    data.tileX = tileX;
    data.tileY = tileY;

    executionPlan.setData(data);
}