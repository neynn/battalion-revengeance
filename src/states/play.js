import { State } from "../../engine/state/state.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { BattalionContext } from "../battalionContext.js";
import { LOADER_MODE } from "../enums.js";
import { TeamOverride } from "../map/override.js";
import { MapSettings } from "../map/settings.js";
import { ClientMapLoader } from "../systems/map.js";

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

    const over = new TeamOverride("SOMERTIN");
    over.color = {
        "0x661A5E": [105, 125, 108],
        "0xAA162C": [197, 171, 159],
        "0xE9332E": [66, 65, 68],
        "0xFF9085": [71, 75, 136]
    };

    settings.overrides.push(over);
    const matchLoader = await ClientMapLoader.createStoryLoader(gameContext, "presus");

    if(matchLoader) {
        matchLoader.setMode(LOADER_MODE.SP_FIXED);
        matchLoader.loadMap(gameContext, settings);
        matchLoader.startGame(gameContext);
        actionRouter.forceEnqueue(gameContext, createStartTurnIntent());
    }

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

PlayState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}