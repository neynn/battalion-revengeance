import { State } from "../../../engine/state/state.js";
import { BattalionContext } from "../../battalionContext.js";
import { StoryUI } from "../../ui/storyUI.js";

export const StoryState = function() {}

StoryState.prototype = Object.create(State.prototype);
StoryState.prototype.constructor = StoryState;

StoryState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client, world, actionRouter, missionManager } = gameContext;
    const { eventHandler } = world;
    const { router } = client;
    const storyUI = new StoryUI();

    storyUI.load(gameContext);
    eventHandler.toAuthority();
    actionRouter.toSelf();

    missionManager.unlockAll();
    missionManager.selectScenario("GREAT_WAR")
    missionManager.selectCampaign("SOMERTIN");
    missionManager.selectChapterIfPossible(missionManager.getNextChapterIndex());
    missionManager.selectMissionIfPossible(missionManager.getNextMissionIndex());

    router.on("ESCAPE", () => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
}

StoryState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}