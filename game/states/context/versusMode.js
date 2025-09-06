import { ROOM_EVENTS } from "../../../engine/network/events.js";
import { Socket } from "../../../engine/network/socket.js";
import { StateMachine } from "../../../engine/state/stateMachine.js";
import { CLIENT_EVENT } from "../../enums.js";
import { VersusModeLobbyState } from "./versus/versusModeLobby.js";
import { VersusModePlayState } from "./versus/versusModePlay.js";
import { ServerEvents } from "../../serverEvents.js";
import { ArmyContext } from "../../armyContext.js";

export const VersusModeState = function() {
    StateMachine.call(this);

    this.addState(ArmyContext.STATE.VERSUS_MODE_LOBBY, new VersusModeLobbyState());
    this.addState(ArmyContext.STATE.VERSUS_MODE_PLAY, new VersusModePlayState());
}

VersusModeState.prototype = Object.create(StateMachine.prototype);
VersusModeState.prototype.constructor = VersusModeState;

VersusModeState.prototype.onServerMessage = function(gameContext, type, payload) {
    console.log(type, payload, "FROM SERVER");

    switch(type) {
        case ROOM_EVENTS.ROOM_UPDATE: {
            ServerEvents.roomUpdate(gameContext, payload);
            break;
        }
        case ROOM_EVENTS.START_INSTANCE: {
            this.setNextState(gameContext, ArmyContext.STATE.VERSUS_MODE_PLAY);
            break;
        }
        case CLIENT_EVENT.INSTANCE_GAME: {
            ServerEvents.instanceGame(gameContext, payload);
            break;
        }
        case CLIENT_EVENT.INSTANCE_ACTOR: {
            ServerEvents.instanceActor(gameContext, payload);
            break;
        }
        case CLIENT_EVENT.INSTANCE_MAP: {
            ServerEvents.instanceMapFromID(gameContext, payload);
            break;
        }
        case CLIENT_EVENT.INSTANCE_MAP_FROM_DATA: {
            ServerEvents.instanceMapFromData(gameContext, payload);
            break;
        }
        case CLIENT_EVENT.INSTANCE_ENTITY_BATCH: {
            ServerEvents.instanceEntityBatch(gameContext, payload);
            break;
        }
        case CLIENT_EVENT.EVENT: {
            ServerEvents.gameEvent(gameContext, payload);
            break;
        }
        default: {
            console.log("Unknown message type " + type);
            break;
        }
    }
}

VersusModeState.prototype.onEnter = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    gameContext.setGameMode(ArmyContext.GAME_MODE.VERSUS);

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, (socketID) => {
        socket.registerName("neyn!");
    }, { once: true });

    socket.events.on(Socket.EVENT.MESSAGE_FROM_SERVER, (type, payload) => this.onServerMessage(gameContext, type, payload));
    socket.connect();

    this.setNextState(gameContext, ArmyContext.STATE.VERSUS_MODE_LOBBY);
}