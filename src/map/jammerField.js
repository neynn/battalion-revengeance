import { JAMMER_FLAG } from "../enums.js";

export const JammerField = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.blockers = [];
}

JammerField.prototype.isJammed = function(gameContext, teamID, flags) {
    const { teamManager } = gameContext;

    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if((blocker.flags & flags) !== 0) {
            const isAlly = teamManager.isAlly(teamID, blocker.teamID);

            if(!isAlly) {
                return true;
            }
        }
    }

    return false;
}

JammerField.prototype.removeBlocker = function(teamID, flags) {
    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if(blocker.teamID === teamID) {
            blocker.flags &= ~flags;

            if(blocker.flags === JAMMER_FLAG.NONE) {
                this.blockers[i] = this.blockers[this.blockers.length - 1];
                this.blockers.pop();
                break;
            }
        }
    }
}

JammerField.prototype.addBlocker = function(teamID, flags) {
    let blockerFound = false;

    for(let i = 0; i < this.blockers.length; i++) {
        const blocker = this.blockers[i];

        if(blocker.teamID === teamID) {
            blocker.flags |= flags;
            blockerFound = true;
            break;
        }
    }
   
    if(!blockerFound) {
        this.blockers.push({
            "teamID": teamID,
            "flags": flags
        });
    }
}

JammerField.prototype.isEmpty = function() {
    return this.blockers.length === 0;
}