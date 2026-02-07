import { getRandomElement } from "../../../engine/math/math.js";
import { Socket } from "../../../engine/network/socket.js";
import { State } from "../../../engine/state/state.js";
import { GAME_EVENT } from "../../enums.js";
import { ClientMapFactory } from "../../systems/map.js";

export const ArenaState = function() {}

const NAME = getRandomElement(["FOO", "BAR", "BAZ", "NEYN", "PEARL", "GHOST", "NEMESIS"]);

ArenaState.prototype = Object.create(State.prototype);
ArenaState.prototype.constructor = ArenaState;

ArenaState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { client, actionRouter, world, uiCore } = gameContext;
    const { eventHandler } = world;
    const { socket } = client;

    eventHandler.blockEvents();
    actionRouter.toOther();

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({ id }) => {
        console.log(id);
        socket.registerName(NAME);
    });

    socket.events.on(Socket.EVENT.MESSAGE_FROM_SERVER, ({ message }) => {
        const { type, payload } = message;

        switch(type) {
            case GAME_EVENT.MP_SERVER_LOAD_MAP: {
                ClientMapFactory.mpClientCreateStaticMap(gameContext, payload)
                .then(() => {
                    socket.messageRoom(GAME_EVENT.MP_CLIENT_MAP_LOADED, {});
                });

                break;
            }
            case GAME_EVENT.MP_SERVER_LOAD_MAP_CUSTOM: {

                break;
            }
            case GAME_EVENT.MP_SERVER_START_MAP: {
                console.log("MAP_STARTED");
                uiCore.arena.hide();
                break;
            }
            case GAME_EVENT.MP_SERVER_EXECUTE_PLAN: {
                const { plans } = payload;

                for(const plan of plans) {
                    actionRouter.onServerPlan(gameContext, plan);
                }

                break;
            }
            case GAME_EVENT.MP_SERVER_TRIGGER_EVENT: {
                const { eventID } = payload;

                eventHandler.forceTrigger(gameContext, eventID);
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