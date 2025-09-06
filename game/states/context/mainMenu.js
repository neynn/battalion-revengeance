import { State } from "../../../engine/state/state.js";
import { UICollider } from "../../../engine/ui/uiCollider.js";
import { ArmyContext } from "../../armyContext.js";

export const MainMenuState = function() {}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

const loadUI = function(gameContext, stateMachine) {
    const { uiManager, spriteManager } = gameContext;
    const mainMenuInterface = uiManager.parseGUI(gameContext, "MAIN_MENU");

    mainMenuInterface.addClick("BUTTON_PLAY", () => stateMachine.setNextState(gameContext, ArmyContext.STATE.STORY_MODE));
    mainMenuInterface.addClick("BUTTON_EDIT", () => stateMachine.setNextState(gameContext, ArmyContext.STATE.EDIT_MODE));
    mainMenuInterface.addClick("BUTTON_VERSUS", () => stateMachine.setNextState(gameContext, ArmyContext.STATE.VERSUS_MODE));
    mainMenuInterface.addClick("BUTTON_EXTRA", () => {
        gameContext.client.soundPlayer.play("sound_red_stormtrooper_death");
        gameContext.client.musicPlayer.playTrack("music_credits");
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

    buttonPlay.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_aim"));
    buttonPlay.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_idle"));

    buttonVersus.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_aim"));
    buttonVersus.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_idle"));

    buttonEdit.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_aim"));
    buttonEdit.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_idle"));

    buttonExtra.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spriteExtra.getIndex(), "red_stormtrooper_aim"));
    buttonExtra.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spriteExtra.getIndex(), "red_stormtrooper_idle"));
}

MainMenuState.prototype.onEnter = function(gameContext, stateMachine) {
    gameContext.setGameMode(ArmyContext.GAME_MODE.NONE);

    loadUI(gameContext, stateMachine);
}