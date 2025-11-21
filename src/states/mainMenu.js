import { State } from "../../engine/state/state.js";
import { UICollider } from "../../engine/ui/uiCollider.js";
import { BattalionContext } from "../battalionContext.js";

export const MainMenuState = function() {}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.loadUI = function(gameContext, stateMachine) {
    const { uiManager, spriteManager, client } = gameContext;
    const { musicPlayer, soundPlayer } = client;
    const mainMenuInterface = uiManager.parseGUI(gameContext, "MAIN_MENU");

    mainMenuInterface.getElement("BUTTON_PLAY").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.PLAY));
    mainMenuInterface.getElement("BUTTON_EDIT").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAP_EDITOR));
    mainMenuInterface.getElement("BUTTON_EXTRA").setClick(() => {
        //soundPlayer.play("sound_red_stormtrooper_death");
        musicPlayer.playPlaylist("EPIC_NAVAL");
    });

    const buttonPlay = mainMenuInterface.getElement("BUTTON_PLAY");
    const buttonVersus = mainMenuInterface.getElement("BUTTON_VERSUS");
    const buttonEdit = mainMenuInterface.getElement("BUTTON_EDIT");
    const buttonExtra = mainMenuInterface.getElement("BUTTON_EXTRA");

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

MainMenuState.prototype.onEnter = async function(gameContext, stateMachine) {
    this.loadUI(gameContext, stateMachine);
}

MainMenuState.prototype.onExit = function(gameContext, stateMachine) {
    gameContext.exit();
}