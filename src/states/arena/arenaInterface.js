import { parseInterfaceByID } from "../../../engine/ui/parser.js";
import { UserInterface } from "../../../engine/ui/userInterface.js";
import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";

export const ArenaInterface = function() {
    UserInterface.call(this);
}

ArenaInterface.prototype = Object.create(UserInterface.prototype);
ArenaInterface.prototype.constructor = ArenaInterface;

ArenaInterface.prototype.load = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    parseInterfaceByID(gameContext, this, "ARENA");

    this.getElement("BUTTON_BACK").setClick(() => stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));

    this.getElement("BUTTON_CREATE_ROOM").setClick(() => {
        socket.createRoom(0);
    });

    this.getElement("BUTTON_JOIN_ROOM").setClick(() => {
        const roomID = parseInt(prompt("Room-ID?"));

        socket.joinRoom(roomID);
    });

    this.getElement("BUTTON_LEAVE_ROOM").setClick(() => {
        socket.leaveRoom();
    });

    this.getElement("BUTTON_START_INSTANCE").setClick(() => {
        socket.messageRoom(GAME_EVENT.MP_CLIENT_START_MATCH, {
            //map-id
        });
    });
}