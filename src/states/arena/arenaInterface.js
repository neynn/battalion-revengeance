import { parseLayout } from "../../../engine/ui/parser.js";
import { UIContext } from "../../../engine/ui/uiContext.js";
import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";

export const ArenaInterface = function() {
    UIContext.call(this);
}

ArenaInterface.prototype = Object.create(UIContext.prototype);
ArenaInterface.prototype.constructor = ArenaInterface;

ArenaInterface.prototype.load = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    parseLayout(gameContext, this, "ARENA");

    this.addClickByName("BUTTON_BACK", (e) => {
        stateMachine.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU);
    });

    this.addClickByName("BUTTON_CREATE_ROOM", (e) => {
        socket.createRoom(0);
    });

    this.addClickByName("BUTTON_JOIN_ROOM", (e) => {
        const roomID = parseInt(prompt("Room-ID?"));

        socket.joinRoom(roomID);
    });

    this.addClickByName("BUTTON_LEAVE_ROOM", (e) => {
        socket.leaveRoom();
    });

    this.addClickByName("BUTTON_START_INSTANCE", (e) => {
        socket.messageRoom(GAME_EVENT.MP_CLIENT_START_MATCH, {
            //map-id
        });
    });
}