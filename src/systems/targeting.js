import { DIRECTION } from "../enums.js";

export const getLineEntities = function(gameContext, direction, startX, startY, maxRange) {
    let streamX = 0;
    let streamY = 0;

    switch(direction) {
        case DIRECTION.EAST: {
            streamX = 1;
            break;
        }
        case DIRECTION.NORTH: {
            streamY = -1;
            break;
        }
        case DIRECTION.SOUTH: {
            streamY = 1;
            break;
        }
        case DIRECTION.WEST: {
            streamX = -1;
            break;
        }
        default: {
            console.error("Faulty direction! Using EAST.");
            streamX = 1;
            break;
        }
    }

    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targets = [];

    let currentX = startX + streamX;
    let currentY = startY + streamY;
    let range = 0;

    while(range < maxRange && !worldMap.isTileOutOfBounds(currentX, currentY)) {
        const entityID = worldMap.getTopEntity(currentX, currentY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            targets.push(entity);
        }

        currentX += streamX;
        currentY += streamY;
        range++;
    }

    return targets;
}

export const getAreaEntities = function(gameContext, tileX, tileY, range) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targets = [];
    
    worldMap.fill2DArea(tileX, tileY, range, range, (nextX, nextY) => {
        const entityID = worldMap.getTopEntity(nextX, nextY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            targets.push(entity);
        }
    });

    return targets;
}