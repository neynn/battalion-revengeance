import { getRandomElement } from "../../../engine/math/math.js";
import { Socket } from "../../../engine/network/socket.js";
import { State } from "../../../engine/state/state.js";
import { ArenaInterface } from "./arenaInterface.js";

export const ArenaState = function() {}

const NAME = getRandomElement(["FOO", "BAR", "BAZ", "NEYN", "PEARL", "GHOST", "NEMESIS"]);

ArenaState.prototype = Object.create(State.prototype);
ArenaState.prototype.constructor = ArenaState;

ArenaState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({id}) => {
        console.log(id);
        socket.registerName(NAME);
    });

    const arenaInterface = new ArenaInterface();
    
    arenaInterface.load(gameContext, stateMachine);

    socket.connect();
}

ArenaState.prototype.onExit = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { socket } = client;

    socket.disconnect();
    gameContext.exit();
}