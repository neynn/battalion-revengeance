import { DIRECTION } from "../enums.js";

export const getDirectionVector = function(direction) {
    let deltaX = 0;
    let deltaY = 0;

    switch(direction) {
        case DIRECTION.NORTH: {
            deltaY = -1;
            break;
        }
        case DIRECTION.EAST: {
            deltaX = 1;
            break;
        }
        case DIRECTION.SOUTH: {
            deltaY = 1;
            break;  
        }
        case DIRECTION.WEST: {
            deltaX = -1;
            break;
        }
    }

    return {
        "x": deltaX,
        "y": deltaY
    }
}

export const getDirectionByDelta = function(deltaX, deltaY) {
    if(deltaY < 0) return DIRECTION.NORTH;
    if(deltaY > 0) return DIRECTION.SOUTH;
    if(deltaX < 0) return DIRECTION.WEST;
    if(deltaX > 0) return DIRECTION.EAST;

    return DIRECTION.EAST;
}

export const getDirectionByName = function(name) {
    return DIRECTION[name] ?? DIRECTION.EAST;
}