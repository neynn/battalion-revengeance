import { TypeRegistry } from "../type/typeRegistry.js";

export const mpIsPlayerIntentValid = function(gameContext, intent, clientID) {
    if(typeof intent !== "object") {
        return false;
    }

    const { type, data } = intent;

    switch(type) {
        case TypeRegistry.ACTION_TYPE.ATTACK: {
            return true;
        }
        case TypeRegistry.ACTION_TYPE.MOVE: {
            return true;
        }
        case TypeRegistry.ACTION_TYPE.END_TURN: {
            return true;
        }
        default: {
            console.error("Faulty action sent!");
            return false;
        }
    }
}
