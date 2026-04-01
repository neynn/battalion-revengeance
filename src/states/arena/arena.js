import { getRandomElement } from "../../../engine/math/math.js";
import { ROOM_EVENTS } from "../../../engine/network/events.js";
import { Socket } from "../../../engine/network/socket.js";
import { State } from "../../../engine/state/state.js";
import { unpackPlan } from "../../action/planPacker.js";
import { GAME_EVENT } from "../../enums.js";
import { createClientMapLoader } from "../../systems/map.js";

export const ArenaState = function() {}

const NAME = getRandomElement(["FOO", "BAR", "BAZ", "NEYN", "PEARL", "GHOST", "NEMESIS"]);

ArenaState.prototype = Object.create(State.prototype);
ArenaState.prototype.constructor = ArenaState;

ArenaState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { client, actionRouter, world, uiCore } = gameContext;
    const { eventHandler, actionQueue } = world;
    const { socket } = client;

    eventHandler.toReceiver();
    actionRouter.toOther();

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({ id }) => {
        console.log(id);
        socket.registerName(NAME);
    });

    socket.events.on(Socket.EVENT.MESSAGE_FROM_SERVER, ({ type, payload }) => {
        switch(type) {
            case GAME_EVENT.MP_SERVER_LOAD_MAP: {
                const { snapshot, client, overrides } = payload;
                const { mapID } = snapshot;
            
                createClientMapLoader(gameContext, mapID)
                .then((mapLoader) => {
                    if(mapLoader) {
                        mapLoader.clientTeam = client;
                        mapLoader.loadInitialServerSnapshot(gameContext, snapshot, overrides);
                        socket.messageRoom(GAME_EVENT.MP_CLIENT_MAP_LOADED, {});
                    } else {
                        //TODO: Signal a failed load.
                    }
                });

                break;
            }
            case GAME_EVENT.MP_SERVER_START_MAP: {
                console.log("MAP_STARTED");
                uiCore.arena.hide();
                break;
            }
            case GAME_EVENT.MP_SERVER_PLAN_UPDATE: {
                for(const plan of payload) {
                    const executionPlan = unpackPlan(plan);

                    if(executionPlan.isValid()) {
                        actionQueue.enqueue(executionPlan);
                    } else {
                        //...
                    }
                }

                break;
            }
            case GAME_EVENT.MP_SERVER_EVENT_UPDATE: {
                for(const eventID of payload) {
                    eventHandler.forceTrigger(gameContext, eventID);
                }

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

    uiCore.arena.show();
    uiCore.arena.loadEvents(gameContext);
}

ArenaState.prototype.onExit = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    socket.disconnect();
    gameContext.exit();
}