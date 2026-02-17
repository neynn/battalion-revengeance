import { JAMMER_FLAG } from "../enums.js";

export const JammerTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.blockers = [];
}

JammerTile.prototype.isJammed = function(gameContext, teamID, flags) {
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

JammerTile.prototype.removeBlocker = function(teamID, flags) {
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

JammerTile.prototype.addBlocker = function(teamID, flags) {
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

JammerTile.prototype.isEmpty = function() {
    return this.blockers.length === 0;
}