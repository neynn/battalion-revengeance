export const Transform2D = function() {
    this.tileWidth = 64;
    this.tileHeight = 64;
    this.halfTileWidth = 32;
    this.halfTileHeight = 32;
}

Transform2D.prototype.setSize = function(tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.halfTileWidth = tileWidth / 2;
    this.halfTileHeight = tileHeight / 2;
}

Transform2D.prototype.transformWorldToTileToWorld = function(positionX, positionY) {
    const { x, y } = this.transformWorldToTile(positionX, positionY);

    return this.transformTileToWorld(x, y);
}

Transform2D.prototype.transformTileToWorld = function(tileX, tileY) {
	const positionX = tileX * this.tileWidth;
	const positionY = tileY * this.tileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}

Transform2D.prototype.transformWorldToTile = function(positionX, positionY) {
    const tileX = Math.floor(positionX / this.tileWidth);
	const tileY = Math.floor(positionY / this.tileHeight);

	return {
		"x": tileX,
		"y": tileY 
	}
}

Transform2D.prototype.transformSizeToWorldOffsetCenter = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX / 2 - 0.5);
    const yOffset = this.tileHeight * (sizeY / 2 - 0.5);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

Transform2D.prototype.transformSizeToWorldOffset = function(sizeX, sizeY) {
    const xOffset = this.tileWidth * (sizeX - 1);
    const yOffset = this.tileHeight * (sizeY - 1);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

Transform2D.prototype.transformTileToWorldCenter = function(tileX, tileY) {
    const positionX = tileX * this.tileWidth + this.halfTileWidth;
	const positionY = tileY * this.tileHeight + this.halfTileHeight;

	return {
		"x": positionX,
		"y": positionY
	}
}

Transform2D.prototype.transformSizeToRandomOffset = function(sizeX, sizeY, maxOffsetX, maxOffsetY) {
    const offsetX = (Math.random() * 2 - 1) * maxOffsetX;
    const offsetY = (Math.random() * 2 - 1) * maxOffsetY;
    const randomX = Math.floor(Math.random() * sizeX);
    const randomY = Math.floor(Math.random() * sizeY);
    const { x, y } = this.transformTileToWorld(randomX, randomY);

    return {
        "x": x + offsetX,
        "y": y + offsetY
    }
}