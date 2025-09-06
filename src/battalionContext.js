import { GameContext } from "../engine/gameContext.js";
import { MainMenuState } from "./states/mainMenu.js";
import { MapEditorState } from "./states/mapEditor.js";
import { PlayState } from "./states/play.js";

export const BattalionContext = function() {
    GameContext.call(this);

    this.transform2D.setSize(56, 56);
}

BattalionContext.STATE = {
    PLAY: "PLAY",
    MAIN_MENU: "MAIN_MENU",
    MAP_EDITOR: "MAP_EDITOR"
};

BattalionContext.prototype = Object.create(GameContext.prototype);
BattalionContext.prototype.constructor = BattalionContext;

BattalionContext.prototype.init = function(resources) {
    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.PLAY, new PlayState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
}