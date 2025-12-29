import { State } from "../../engine/state/state.js";
import { BattalionContext } from "../battalionContext.js";
import { createStoryMap } from "../systems/map.js";
import { loadStoryMap } from "../systems/save.js";

export const PlayState = function() {}

PlayState.prototype = Object.create(State.prototype);
PlayState.prototype.constructor = PlayState;

PlayState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client } = gameContext;
    const { router } = client;

    createStoryMap(gameContext, "kanye_911")
    .then(() => loadStoryMap(gameContext, {
        "edits": [],
        "entities": [
            //{"type":"ALEPH","flags":0,"health":10,"maxHealth":50,"morale":"NONE","name":null,"desc":null,"id":null,"tileX":6,"tileY":7,"tileZ":-1,"teamID":"SOMERTIN","transport":null,"direction":4,"state":0},
        ]
    }));

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

PlayState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}