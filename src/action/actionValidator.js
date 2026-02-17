import { ACTION_TYPE } from "../enums.js";

export const isClientTurn = function(gameContext, messengerID) {
    const { teamManager, mapSettings, world } = gameContext;
    const { turnManager } = world;
    const { slots } = mapSettings;
    const { currentActor } = turnManager;

    if(!currentActor) {
        return false;
    }

    //TODO: Create a ServerActor that has clientID and check currentActor.clientID === clientID. O(1)!
    for(const slot of slots) {
        const { clientID, teamID } = slot;
        //TODO: This is a hack because slots SHOULD transform their teamID to the runtime id/index.
        const tTeamID = teamManager.getTeamID(teamID);

        if(clientID === messengerID && currentActor.teamID === tTeamID) {
            return true;
        }
    }

    return false;
}

export const mpIsPlayerIntentValid = function(gameContext, type, data, clientID) {
    if(!isClientTurn(gameContext, clientID)) {
        return false;
    } 

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
