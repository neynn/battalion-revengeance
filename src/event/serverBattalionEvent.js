import { BattalionEvent } from "./battalionEvent.js";
import { spawnServerEntity } from "../systems/spawn.js";
import { createTileExplodeIntent } from "../action/actionHelper.js";
import { GAME_EVENT } from "../enums.js";
import { EntityManager } from "../../engine/entity/entityManager.js";

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

    //No trigger sent for onTileExplode
}

ServerBattalionEvent.prototype.onSpawn = function(gameContext, action) {
    const { setup } = action;
    const entityID = spawnServerEntity(gameContext, setup);

    //TODO: Spawning entities is NOT an event as it mutates game state
    //Also some entities may need to spawn on non-static spots if blocked.
    if(entityID !== EntityManager.ID.INVALID) {
        gameContext.broadcastMessage(GAME_EVENT.MP_SERVER_TRIGGER_EVENT, {
            "eventID": this.id,
            "entityID": entityID
        });
    }
}