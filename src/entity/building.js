import { StaticObject } from "./staticObject.js";

export const Building = function(config) {
    StaticObject.call(this, config);

    this.customID = null;
    this.customName = null;
    this.customDesc = null;
}

Building.prototype = Object.create(StaticObject.prototype);
Building.prototype.constructor = Building;

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