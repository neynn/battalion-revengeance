import { TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";

export const transformTileToWorld = function(tileX, tileY) {
	const positionX = tileX * TILE_WIDTH;
	const positionY = tileY * TILE_HEIGHT;

	return {
		"x": positionX,
		"y": positionY
	}
}

export const transformTileToWorldCenter = function(tileX, tileY) {
    const positionX = tileX * TILE_WIDTH + (TILE_WIDTH / 2);
	const positionY = tileY * TILE_HEIGHT + (TILE_HEIGHT / 2);

	return {
		"x": positionX,
		"y": positionY
	}
}

export const transformWorldToTile = function(positionX, positionY) {
    const tileX = Math.floor(positionX / TILE_WIDTH);
	const tileY = Math.floor(positionY / TILE_HEIGHT);

	return {
		"x": tileX,
		"y": tileY 
	}
}

export const transformSizeToWorldOffset = function(sizeX, sizeY) {
    const xOffset = TILE_WIDTH * (sizeX - 1);
    const yOffset = TILE_HEIGHT * (sizeY - 1);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

export const transformSizeToWorldOffsetCenter = function(sizeX, sizeY) {
    const xOffset = TILE_WIDTH * (sizeX / 2 - 0.5);
    const yOffset = TILE_HEIGHT * (sizeY / 2 - 0.5);

    return { 
		"x": xOffset,
		"y": yOffset
	}
}

export const transformSizeToRandomOffset = function(sizeX, sizeY, maxOffsetX, maxOffsetY) {
    const offsetX = (Math.random() * 2 - 1) * maxOffsetX;
    const offsetY = (Math.random() * 2 - 1) * maxOffsetY;
    const randomX = Math.floor(Math.random() * sizeX);
    const randomY = Math.floor(Math.random() * sizeY);
    const world = transformTileToWorld(randomX, randomY);

    world.x += offsetX;
    world.y += offsetY;

    return world;
}

export const transformWorldToTileToWorld = function(positionX, positionY) {
    const { x, y } = transformWorldToTile(positionX, positionY);

    return transformTileToWorld(x, y);
}