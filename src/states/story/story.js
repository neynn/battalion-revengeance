import { State } from "../../../engine/state/state.js";
import { createStartTurnIntent } from "../../action/actionHelper.js";
import { BattalionContext } from "../../battalionContext.js";
import { TeamOverride } from "../../map/override.js";
import { COMPLETION_STATE } from "../../mission/constants.js";
import { createClientMapLoader } from "../../systems/map.js";
import { StoryUI } from "../../ui/storyUI.js";

export const StoryState = function() {}

StoryState.prototype = Object.create(State.prototype);
StoryState.prototype.constructor = StoryState;

StoryState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client, world, actionRouter, missionManager } = gameContext;
    const { eventHandler } = world;
    const { router } = client;
    const storyUI = new StoryUI(gameContext);

    eventHandler.toAuthority();
    actionRouter.toSelf();

    /*
    const over = new TeamOverride("SOMERTIN");
    over.color = {
        "0x661A5E": [105, 125, 108],
        "0xAA162C": [197, 171, 159],
        "0xE9332E": [66, 65, 68],
        "0xFF9085": [71, 75, 136]
    };

    const matchLoader = await createClientMapLoader(gameContext, "presus");

    if(matchLoader) {
        matchLoader.loadMapFromFile(gameContext, [over]);
        actionRouter.forceEnqueue(gameContext, createStartTurnIntent());
    }
    */

    missionManager.unlockAll();
    missionManager.selectScenario("GREAT_WAR")
    missionManager.selectCampaign("SOMERTIN");
    missionManager.chapters.get("SOMERTIN_C1").state = COMPLETION_STATE.COMPLETED;
    missionManager.selectChapterIfPossible(missionManager.getNextChapterIndex());
    missionManager.selectMissionIfPossible(missionManager.getNextMissionIndex());
    storyUI.load();
    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

StoryState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}