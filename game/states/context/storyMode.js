import { StateMachine } from "../../../engine/state/stateMachine.js";
import { ArmyContext } from "../../armyContext.js";
import { StoryModeIntroState } from "./story/storyModeIntro.js";
import { StoryModePlayState } from "./story/storyModePlay.js";

export const StoryModeState = function() {
    StateMachine.call(this);
    
    this.addState(ArmyContext.STATE.STORY_MODE_INTRO, new StoryModeIntroState());
    this.addState(ArmyContext.STATE.STORY_MODE_PLAY, new StoryModePlayState());
}

StoryModeState.prototype = Object.create(StateMachine.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.onEnter = function(gameContext, stateMachine) {
    gameContext.setGameMode(ArmyContext.GAME_MODE.STORY);
    
    this.setNextState(gameContext, ArmyContext.STATE.STORY_MODE_PLAY);
}