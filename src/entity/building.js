export const Building = function(id, config, sprite) {
    this.id = id;
    this.config = config;
    this.sprite = sprite;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = null;
    this.customID = null;
    this.customName = null;
    this.customDesc = null;
}

Building.prototype.hasTrait = function(traitID) {
    return this.config.hasTrait(traitID);
}

Building.prototype.isCapturable = function(gameContext, teamID) {
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
            const { colorID, color } = nextTeam;
            const previousTeam = teamManager.getTeam(this.teamID);

            if(previousTeam) {
                previousTeam.removeBuilding(this);
            }

            nextTeam.addBuilding(this);
    
            this.teamID = teamID;
            this.sprite.updateSchema(gameContext, colorID, color);
        }
    }
}

Building.prototype.getID = function() {
    return this.id;
}

Building.prototype.isPlacedOn = function(tileX, tileY) {
    return this.tileX === tileX && this.tileY === tileY;
}

Building.prototype.setTile = function(gameContext, tileX, tileY) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

    this.tileX = tileX;
    this.tileY = tileY;
    this.sprite.setPosition(x, y);
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

Building.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

Building.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}