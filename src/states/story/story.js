import { State } from "../../../engine/state/state.js";
import { BattalionContext } from "../../battalionContext.js";
import { StoryUI } from "../../ui/contexts/storyUI.js";

export const StoryState = function() {
    this.storyUI = new StoryUI();
}

StoryState.prototype = Object.create(State.prototype);
StoryState.prototype.constructor = StoryState;

StoryState.prototype.onEnter = async function(gameContext, stateMachine, transition) {
    const { client, world, actionRouter, missionManager } = gameContext;
    const { eventHandler } = world;
    const { router } = client;

    this.storyUI.load(gameContext);
    this.storyUI.show();

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
    this.storyUI.hide();

    gameContext.exit();
}