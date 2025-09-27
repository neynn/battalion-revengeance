import { TypeRegistry } from "../typeRegistry";

export const Team = function(id) {
    this.id = id;
    this.allies = []; //IDs of allied teams.
    this.enemies = []; //IDs of enemy teams.
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.ALIVE;
}

Team.STATUS = {
    ALIVE: 0,
    DEFEATED: 1,
    SPECTATING: 2
};

Team.prototype.setCustomColor = function(color) {
    this.colorID = "CUSTOM_" + this.id;
    this.color = color;
}

Team.prototype.setColor = function(gameContext, colorID) {
    const { typeRegistry } = gameContext;
    const color = typeRegistry.getType(colorID, TypeRegistry.CATEGORY.SCHEMA);

    if(color) {
        this.colorID = colorID;
        this.color = color;
    }
}