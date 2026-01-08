import { Building } from "./building.js";

export const ClientBuilding = function(id, config, view) {
    Building.call(this, id, config);

    this.view = view;
}

ClientBuilding.prototype = Object.create(Building.prototype);
ClientBuilding.prototype.constructor = ClientBuilding;

ClientBuilding.prototype.onTileUpdate = function(gameContext, previousX, previousY) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformTileToWorld(this.tileX, this.tileY);

    this.view.setPosition(x, y);
}

ClientBuilding.prototype.onTeamUpdate = function(gameContext, team) {
    const { colorID, color } = team;

    this.view.updateSchema(gameContext, colorID, color);
}

ClientBuilding.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

ClientBuilding.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}