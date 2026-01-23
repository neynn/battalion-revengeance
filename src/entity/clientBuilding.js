import { Building } from "./building.js";

export const ClientBuilding = function(config, view) {
    Building.call(this, config);

    this.view = view;
}

ClientBuilding.prototype = Object.create(Building.prototype);
ClientBuilding.prototype.constructor = ClientBuilding;

ClientBuilding.prototype.onTeamUpdate = function(gameContext, team) {
    const { colorID, color } = team;

    this.view.updateSchema(gameContext, colorID, color);
}