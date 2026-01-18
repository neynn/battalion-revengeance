export const Building = function(config) {
    this.config = config;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = null;
    this.customID = null;
    this.customName = null;
    this.customDesc = null;
}

Building.prototype.onTileUpdate = function(gameContext, previousX, previousY) {}
Building.prototype.onTeamUpdate = function(gameContext, team) {}

Building.prototype.getGeneratedCash = function(gameContext) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of this.config.traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    return generatedCash;
}

Building.prototype.isOwnedBy = function(teamID) {
    return this.teamID === teamID;
}

Building.prototype.isBlocking = function(building) {
    const { tileX, tileY } = building;

    return this.isPlacedOn(tileX, tileY);
}

Building.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.config.traits.length; i++) {
        if(this.config.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

Building.prototype.isEnemy = function(gameContext, teamID) {
    const { teamManager } = gameContext; 

    if(this.teamID === teamID) {
        return false;
    }

    if(teamManager.isAlly(this.teamID, teamID)) {
        return false;
    }

    return true;
}

Building.prototype.updateTeam = function(gameContext, teamID) {
    const { teamManager } = gameContext;

    if(this.teamID !== teamID) {
        const nextTeam = teamManager.getTeam(teamID);

        if(nextTeam) {
            const previousTeam = teamManager.getTeam(this.teamID);

            if(previousTeam) {
                previousTeam.removeBuilding(this);
            }

            nextTeam.addBuilding(this);
    
            this.teamID = teamID;
            this.onTeamUpdate(gameContext, nextTeam);
        }
    }
}

Building.prototype.isPlacedOn = function(tileX, tileY) {
    return this.tileX === tileX && this.tileY === tileY;
}

Building.prototype.setTile = function(gameContext, tileX, tileY) {
    const previousX = this.tileX;
    const previousY = this.tileY;

    this.tileX = tileX;
    this.tileY = tileY;
    this.onTileUpdate(gameContext, previousX, previousY);
}

Building.prototype.setCustomInfo = function(id, name, desc) {
    this.customID = id;

    if(name) {
        this.customName = name;
    }

    if(desc) {
        this.customDesc = desc;
    }
}