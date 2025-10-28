export const JammerField = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.blockers = [];
}

JammerField.prototype.removeBlocker = function(teamID) {
    for(let i = 0; i < this.blockers.length; i++) {
        if(this.blockers[i] === teamID) {
            this.blockers[i] = this.blockers[this.blockers.length - 1];
            this.blockers.pop();
            break;
        }
    }
}

JammerField.prototype.addBlocker = function(teamID) {
    for(let i = 0; i < this.blockers.length; i++) {
        if(this.blockers[i] === teamID) {
            return;
        }
    }

    this.blockers.push(teamID);
}

JammerField.prototype.isEmpty = function() {
    return this.blockers.length === 0;
}