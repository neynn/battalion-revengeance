export const Building = function(id, config, sprite) {
    this.id = id;
    this.config = config;
    this.sprite = sprite;
    this.teamID = null;
    this.tileX = -1;
    this.tileY = -1;
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