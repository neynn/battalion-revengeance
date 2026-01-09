import { BattalionEvent } from "./battalionEvent.js";
import { spawnServerEntity } from "../systems/spawn.js";
import { createTileExplodeIntent } from "../action/actionHelper.js";

export const ServerBattalionEvent = function(id, actions) {
    BattalionEvent.call(this, id, actions);
}

ServerBattalionEvent.prototype = Object.create(BattalionEvent.prototype);
ServerBattalionEvent.prototype.constructor = ServerBattalionEvent;

ServerBattalionEvent.prototype.onTileExplode = function(gameContext, action) {
    const { actionRouter } = gameContext;
    const { layer, x, y } = action;
    const actionIntent = createTileExplodeIntent(layer, x, y);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}

ServerBattalionEvent.prototype.onSpawn = function(gameContext, action) {
    const { setup } = action;

    spawnServerEntity(gameContext, setup);
}