import { parseLayout } from "../../../engine/ui/parser.js";
import { UIContext } from "../../../engine/ui/uiContext.js";
import { BattalionContext } from "../../battalionContext.js";

export const MainMenuInterface = function() {
    UIContext.call(this);
}

MainMenuInterface.prototype = Object.create(UIContext.prototype);
MainMenuInterface.prototype.constructor = MainMenuInterface;

MainMenuInterface.prototype.load = function(gameContext, stateMachine) {
    const { spriteManager, client } = gameContext;
    const { musicPlayer } = client;

    parseLayout(gameContext, this, "MAIN_MENU");

    this.addClickByName("BUTTON_PLAY", (e) => stateMachine.setNextState(gameContext, BattalionContext.STATE.PLAY));
    this.addClickByName("BUTTON_EDIT", (e) => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAP_EDITOR));
    this.addClickByName("BUTTON_VERSUS", (e) => stateMachine.setNextState(gameContext, BattalionContext.STATE.ARENA));
    this.addClickByName("BUTTON_EXTRA", (e) => musicPlayer.playPlaylist("EPIC_NAVAL"));
    
    const buttonPlay = this.getElement("BUTTON_PLAY");
    const buttonVersus = this.getElement("BUTTON_VERSUS");
    const buttonEdit = this.getElement("BUTTON_EDIT");
    const buttonExtra = this.getElement("BUTTON_EXTRA");

    const spritePlay = spriteManager.createSprite("lancer_tank_idle_right");
    const spriteVersus = spriteManager.createSprite("red_battletank_idle");
    const spriteEdit = spriteManager.createSprite("hunter_support_idle_right");
    const spriteExtra = spriteManager.createSprite("aleph_idle_down");

    spritePlay.setPosition(-20, -30);
    spriteEdit.setPosition(-20, -30);
    spriteExtra.setPosition(-20, -30);

    buttonPlay.addChild(spritePlay);
    buttonVersus.addChild(spriteVersus);
    buttonEdit.addChild(spriteEdit)
    buttonExtra.addChild(spriteExtra);
}