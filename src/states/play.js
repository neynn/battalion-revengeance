import { State } from "../../engine/state/state.js";
import { BattalionContext } from "../battalionContext.js";
import { createStoryMap } from "../systems/map.js";

export const PlayState = function() {}

PlayState.prototype = Object.create(State.prototype);
PlayState.prototype.constructor = PlayState;

PlayState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client } = gameContext;
    const { router } = client;

    createStoryMap(gameContext, "presus");

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

PlayState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}