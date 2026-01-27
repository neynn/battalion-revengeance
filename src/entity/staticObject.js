export const StaticObject = function(config) {
    this.config = config;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = null;
}

StaticObject.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

StaticObject.prototype.getTeam = function(gameContext) {
    const { teamManager } = gameContext;

    return teamManager.getTeam(this.teamID);
}

StaticObject.prototype.isOwnedBy = function(teamID) {
    return this.teamID === teamID;
}

StaticObject.prototype.isBlocking = function(staticObject) {
    const { tileX, tileY } = staticObject;

    return this.isPlacedOn(tileX, tileY);
}

StaticObject.prototype.isPlacedOn = function(tileX, tileY) {
    return this.tileX === tileX && this.tileY === tileY;
}

StaticObject.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

StaticObject.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.config.traits.length; i++) {
        if(this.config.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

StaticObject.prototype.isEnemy = function(gameContext, teamID) {
    const { teamManager } = gameContext; 

    if(this.teamID === teamID) {
        return false;
    }

    if(teamManager.isAlly(this.teamID, teamID)) {
        return false;
    }

    return true;
}

StaticObject.prototype.positionToJSON = function() {
    return {
        "x": this.tileX,
        "y": this.tileY
    }
}