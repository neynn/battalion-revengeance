export const Building = function(config, sprite) {
    this.config = config;
    this.sprite = sprite;
    this.tileX = -1;
    this.tileY = -1;
    this.teamID = null;
    this.customID = null;
    this.customName = null;
    this.customDesc = null;
}

Building.prototype.setTile = function(gameContext, tileX, tileY) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

    this.tileX = tileX;
    this.tileY = tileY;
    this.sprite.setPosition(x, y);
}

Building.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
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