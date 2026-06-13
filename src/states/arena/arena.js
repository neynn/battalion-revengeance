import { getRandomElement } from "../../../engine/math/math.js";
import { ROOM_EVENTS } from "../../../engine/network/events.js";
import { Socket } from "../../../engine/network/socket.js";
import { State } from "../../../engine/state/state.js";
import { GAME_UPDATE_HEADER_SIZE, getGameUpdateHeaderSize } from "../../action/packer_constants.js";
import { unpackPlan } from "../../action/planPacker.js";
import { MP_SERVER_BINARY, MP_CLIENT_JSON, MP_SERVER_JSON } from "../../enums.js";
import { MapSystem } from "../../systems/map.js";
import { ArenaUI } from "../../ui/contexts/arenaUI.js";

export const ArenaState = function() {
    this.version = 0;
    this.arenaUI = new ArenaUI();
}

const NAME = getRandomElement(["FOO", "BAR", "BAZ", "NEYN", "PEARL", "GHOST", "NEMESIS"]);

ArenaState.prototype = Object.create(State.prototype);
ArenaState.prototype.constructor = ArenaState;

ArenaState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { client, actionRouter, world } = gameContext;
    const { eventHandler, actionQueue } = world;
    const { socket } = client;

    eventHandler.toReceiver();
    actionRouter.toOther();

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({ id }) => {
        console.log(id);
        socket.registerName(NAME);
    });

    socket.events.on(Socket.EVENT.BINARY_FROM_SERVER, (binary) => {
        const view = new DataView(binary);
        const type = view.getUint8(0);

        switch(type) {
            case MP_SERVER_BINARY.GAME_UPDATE: {
                const version = view.getUint32(1, true);
                const count = view.getUint16(5, true);
                const fullHeaderSize = getGameUpdateHeaderSize(count);

                let offsetOffset = GAME_UPDATE_HEADER_SIZE;

                for(let i = 0; i < count; i++) {
                    const beginPtr = fullHeaderSize + view.getUint16(offsetOffset, true);
                    const executionPlan = unpackPlan(view, beginPtr);

                    if(executionPlan.isValid()) {
                        actionQueue.enqueue(executionPlan);
                    } else {
                        //...
                    }

                    offsetOffset += 2;
                }

                if((this.version + 1) === version) {
                    this.version = version;
                } else {
                    //Version mismatch!
                }
            }
        }
    });

    socket.events.on(Socket.EVENT.JSON_FROM_SERVER, ({ type, payload }) => {
        console.log(type, payload);

        switch(type) {
            case MP_SERVER_JSON.LOAD_MAP: {
                const { scenario, snapshot, client, overrides } = payload;

                MapSystem.createClientLoader(gameContext, scenario)
                .then(loader => {
                    loader.clientTeam = client;
                    loader.createServerMatch(gameContext, snapshot, overrides);
                    socket.messageRoom(MP_CLIENT_JSON.MAP_LOADED, {});
                })
                .catch(() => {
                    //TODO: Signal a failed load.
                });
                
                break;
            }
            case MP_SERVER_JSON.START_MAP: {
                console.log("MAP_STARTED");
                this.arenaUI.hide();
                break;
            }
            case ROOM_EVENTS.ROOM_UPDATE: {
                console.log(payload);
                break;
            }
            default: {
                console.error("Unsupported event!", type);
                break;
            }
        }
    });

    this.arenaUI.show();
    this.arenaUI.load(gameContext);
}

ArenaState.prototype.onExit = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    this.arenaUI.hide();

    socket.disconnect();
    gameContext.exit();
    
    this.version = 0;
}