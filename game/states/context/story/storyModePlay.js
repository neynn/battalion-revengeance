import { State } from "../../../../engine/state/state.js";
import { StorySystem } from "../../../systems/story.js";

export const StoryModePlayState = function() {
    this.guiID = -1;
}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { uiManager } = gameContext;
    const gui = uiManager.parseGUI(gameContext, "STORY_MODE");

    this.guiID = gui.getID();

    StorySystem.initialize(gameContext);
}

StoryModePlayState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyGUI(this.guiID);
}