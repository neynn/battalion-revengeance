import { Building } from "./building.js";

export const ClientBuilding = function(config, view) {
    Building.call(this, config);

    this.view = view;
}

ClientBuilding.prototype = Object.create(Building.prototype);
ClientBuilding.prototype.constructor = ClientBuilding;

ClientBuilding.prototype.onTeamUpdate = function(gameContext, team) {
    const { schema } = team;

    this.view.updateSchema(gameContext, schema);
}

ClientBuilding.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc !== null) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

ClientBuilding.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName !== null) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}