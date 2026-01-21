import { DIRECTION } from "../enums.js";

export const getLineEntities = function(gameContext, direction, startX, startY, maxRange) {
    const { world } = gameContext;
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

    return world.getEntitiesInLine(startX, startY, streamX, streamY, maxRange);
}