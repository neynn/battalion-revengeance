import { Socket } from "../../../engine/network/socket.js";
import { parseInterfaceByID } from "../../../engine/ui/parser.js";
import { UICollider } from "../../../engine/ui/uiCollider.js";
import { UserInterface } from "../../../engine/ui/userInterface.js";
import { BattalionContext } from "../../battalionContext.js";

export const MainMenuInterface = function() {
    UserInterface.call(this);
}

MainMenuInterface.prototype = Object.create(UserInterface.prototype);
MainMenuInterface.prototype.constructor = MainMenuInterface;

MainMenuInterface.prototype.load = function(gameContext, stateMachine) {
    const { spriteManager, client } = gameContext;
    const { socket, musicPlayer } = client;

    parseInterfaceByID(gameContext, this, "MAIN_MENU");

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({id}) => {
        console.log(id);
        socket.registerName("neyn");
    });

    this.getElement("BUTTON_PLAY").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.PLAY));
    this.getElement("BUTTON_EDIT").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAP_EDITOR));
    this.getElement("BUTTON_EXTRA").setClick(() => musicPlayer.playPlaylist("EPIC_NAVAL"));
    this.getElement("BUTTON_VERSUS").setClick(() => {
        socket.connect();
    });

    const buttonPlay = this.getElement("BUTTON_PLAY");
    const buttonVersus = this.getElement("BUTTON_VERSUS");
    const buttonEdit = this.getElement("BUTTON_EDIT");
    const buttonExtra = this.getElement("BUTTON_EXTRA");

    const spritePlay = spriteManager.createSprite("stealth_tank_idle_right");
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

    buttonPlay.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spritePlay.getIndex(), "stealth_tank_idle_right"));
    buttonPlay.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spritePlay.getIndex(), "stealth_tank_idle_right"));

    buttonVersus.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_aim"));
    buttonVersus.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_idle"));

    buttonEdit.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteEdit.getIndex(), "hunter_support_idle_right"));
    buttonEdit.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteEdit.getIndex(), "hunter_support_idle_right"));

    buttonExtra.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => spriteManager.updateSprite(spriteExtra.getIndex(), "aleph_idle_down"));
    buttonExtra.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => spriteManager.updateSprite(spriteExtra.getIndex(), "aleph_idle_down"));
}