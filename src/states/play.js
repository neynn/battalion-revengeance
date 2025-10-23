import { State } from "../../engine/state/state.js";
import { BattalionContext } from "../battalionContext.js";
import { CameraHelper } from "../camera/cameraHelper.js";
import { MapSpawner } from "../map/mapSpawner.js";

export const PlayState = function() {
    this.contextID = -1;
}

PlayState.prototype = Object.create(State.prototype);
PlayState.prototype.constructor = PlayState;

PlayState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client } = gameContext;
    const { router } = client;
    //const context = CameraHelper.createPlayCamera(gameContext);

    MapSpawner.createMapByID(gameContext, "presus").then(map => {
        map.addJammer(0, 0);
        map.addJammer(1, 0);
        map.addJammer(1, 1);
    });

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));

    //this.contextID = context.getID();
}

PlayState.prototype.onExit = function(gameContext, stateMachine) {
    //const { renderer } = gameContext;

    //renderer.destroyContext(this.contextID);

    //this.contextID = -1;
}