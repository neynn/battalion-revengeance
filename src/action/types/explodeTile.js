import { Action } from "../../../engine/action/action.js";
import { WorldMap } from "../../../engine/map/worldMap.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { playExplosion } from "../../systems/animation.js";
import { despawnEntity } from "../../systems/spawn.js";

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

ExplodeTileAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

ExplodeTileAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

ExplodeTileAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities, tileX, tileY, layerIndex } = data;
    const worldMap = mapManager.getActiveMap();

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        despawnEntity(gameContext, entity);
    }

    worldMap.editTile(layerIndex, tileX, tileY, TILE_ID.NONE);
}

ExplodeTileAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { layerID, tileX, tileY } = actionIntent;
    const index = BattalionMap.getLayerIndex(layerID);

    if(index === WorldMap.INVALID_LAYER_ID) {
        return;
    }

    const entities = [];
    const entity = world.getEntityAt(tileX, tileY);

    if(entity) {
        entities.push(entity.getID());
    }

    executionPlan.setData({
        "entities": entities,
        "layerIndex": index,
        "tileX": tileX,
        "tileY": tileY
    });
}