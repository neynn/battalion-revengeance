import { UICollider } from "../../../engine/ui/uiCollider.js";
import { UserInterface } from "../../../engine/ui/userInterface.js";
import { BattalionContext } from "../../battalionContext.js";

export const MainMenuInterface = function() {
    UserInterface.call(this);
}

MainMenuInterface.prototype = Object.create(UserInterface.prototype);
MainMenuInterface.prototype.constructor = MainMenuInterface;

MainMenuInterface.prototype.load = function(gameContext, stateMachine) {
    const { spriteManager, client, uiManager } = gameContext;
    const { musicPlayer } = client;

    uiManager.parseInterfaceCustom(gameContext, this, "MAIN_MENU");

    this.getElement("BUTTON_PLAY").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.PLAY));
    this.getElement("BUTTON_EDIT").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAP_EDITOR));
    this.getElement("BUTTON_EXTRA").setClick(() => musicPlayer.playPlaylist("EPIC_NAVAL"));

    const buttonPlay = this.getElement("BUTTON_PLAY");
    const buttonVersus = this.getElement("BUTTON_VERSUS");
    const buttonEdit = this.getElement("BUTTON_EDIT");
    const buttonExtra = this.getElement("BUTTON_EXTRA");

    const spritePlay = spriteManager.createSprite("blue_battletank_idle");
    const spriteVersus = spriteManager.createSprite("red_battletank_idle");
    const spriteEdit = spriteManager.createSprite("blue_elite_battery_idle");
    const spriteExtra = spriteManager.createSprite("red_stormtrooper_idle");

    buttonPlay.addChild(spritePlay);
    buttonVersus.addChild(spriteVersus);
    buttonEdit.addChild(spriteEdit)
    buttonExtra.addChild(spriteExtra);

    buttonPlay.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_aim"));
    buttonPlay.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_idle"));

    buttonVersus.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_aim"));
    buttonVersus.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_idle"));

    buttonEdit.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_aim"));
    buttonEdit.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_idle"));

    buttonExtra.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteExtra.getIndex(), "red_stormtrooper_aim"));
    buttonExtra.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteExtra.getIndex(), "red_stormtrooper_idle"));    
}