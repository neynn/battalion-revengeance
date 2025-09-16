import { State } from "../../engine/state/state.js";
import { BattalionContext } from "../battalionContext.js";
import { CameraHelper } from "../camera/cameraHelper.js";
import { EntitySpawner } from "../entity/entitySpawner.js";
import { MapHelper } from "../map/mapHelper.js";

export const PlayState = function() {}

PlayState.prototype = Object.create(State.prototype);
PlayState.prototype.constructor = PlayState;

PlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { router } = client;

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    CameraHelper.createPlayCamera(gameContext);
    MapHelper.createMapById(gameContext, "oasis");
    EntitySpawner.debugEntities(gameContext);
}