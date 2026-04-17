import { EntityManager } from "../../engine/entity/entityManager.js";
import { JAMMER_FLAG } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

const createBlocker = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "teamID": TeamManager.INVALID_ID,
        "flags": JAMMER_FLAG.NONE
    }
}

export const JammerTile = function() {
    this.blockers = [];
}

JammerTile.prototype.isJammed = function(gameContext, teamID, flags) {
    const { teamManager } = gameContext;

    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if(blocker.flags & flags) {
            const isAlly = teamManager.isAlly(teamID, blocker.teamID);

            if(!isAlly) {
                return true;
            }
        }
    }

    return false;
}

JammerTile.prototype.removeBlocker = function(entityID, teamID, flags) {
    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if(blocker.entityID === entityID) {
            this.blockers[i] = this.blockers[this.blockers.length - 1];
            this.blockers.pop();
            break;
        }
    }
}

JammerTile.prototype.addBlocker = function(entityID, teamID, flags) {
    let blockerFound = false;

    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if(blocker.entityID === entityID) {
            blockerFound = true;
            break;
        }
    }
   
    if(!blockerFound) {
        const blocker = createBlocker();

        blocker.entityID = entityID;
        blocker.teamID = teamID;
        blocker.flags = flags;

        this.blockers.push(blocker);
    }
}

JammerTile.prototype.isEmpty = function() {
    return this.blockers.length === 0;
}