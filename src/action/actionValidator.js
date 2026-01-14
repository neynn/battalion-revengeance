import { ACTION_TYPE } from "../enums.js";

export const isClientTurn = function(gameContext, messengerID) {
    const { mapSettings, teamManager, world } = gameContext;
    const { turnManager } = world;
    const { slots } = mapSettings;

    for(const slot of slots) {
        const { clientID, teamID } = slot;

        if(clientID === messengerID) {
            const team = teamManager.getTeam(teamID);
            
            if(team) {
                const { actor } = team;
                
                return turnManager.isActor(actor);
            }
        }
    }

    return false;
}

export const mpIsPlayerIntentValid = function(gameContext, intent, clientID) {
    if(typeof intent !== "object") {
        return false;
    }

    if(!isClientTurn(gameContext, clientID)) {
        return false;
    } 

    const { type, data } = intent;

    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: {
            //Does the building at x, y belong to the team?
            return true;
        }
        case ACTION_TYPE.ATTACK: {
            //Does the entity belong to the team?
            return true;
        }
        case ACTION_TYPE.MOVE: {
            //Does the entity belong to the team?
            return true;
        }
        case ACTION_TYPE.END_TURN: {
            //All good.
            return true;
        }
        default: {
            console.error("Faulty action sent!");
            return false;
        }
    }
}
