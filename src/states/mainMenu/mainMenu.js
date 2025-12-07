import { State } from "../../../engine/state/state.js";
import { MainMenuInterface } from "./mainMenuInterface.js";

export const MainMenuState = function() {}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.onEnter = async function(gameContext, stateMachine) {
    const mainMenuInterface = new MainMenuInterface();
    
    mainMenuInterface.load(gameContext, stateMachine);
}

MainMenuState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}