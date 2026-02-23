import { State } from "../../engine/state/state.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { BattalionContext } from "../battalionContext.js";
import { MapSettings } from "../map/settings.js";
import { ClientMapLoader, ClientMatchLoader } from "../systems/map.js";

export const PlayState = function() {}

PlayState.prototype = Object.create(State.prototype);
PlayState.prototype.constructor = PlayState;

PlayState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client, world, actionRouter } = gameContext;
    const { eventHandler } = world;
    const { router } = client;
    const settings = new MapSettings();

    eventHandler.toAuthority();
    actionRouter.toSelf();

    const matchLoader = await ClientMapLoader.createStoryLoader(gameContext, "presus");

    if(matchLoader) {
        matchLoader.setMode(ClientMatchLoader.MODE.PVE);
        matchLoader.loadMap(gameContext, settings);
        matchLoader.startGame(gameContext);
        actionRouter.forceEnqueue(gameContext, createStartTurnIntent());
    }

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

PlayState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}