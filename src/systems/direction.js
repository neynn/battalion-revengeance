import { DIRECTION } from "../enums.js";

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