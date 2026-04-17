import { DIRECTION } from "../enums.js";

export const DIRECTION_DELTA_X = new Int8Array(DIRECTION._COUNT);

DIRECTION_DELTA_X[DIRECTION.NORTH] = 0;
DIRECTION_DELTA_X[DIRECTION.EAST] = 1;
DIRECTION_DELTA_X[DIRECTION.SOUTH] = 0;
DIRECTION_DELTA_X[DIRECTION.WEST] = -1;

export const DIRECTION_DELTA_Y = new Int8Array(DIRECTION._COUNT);

DIRECTION_DELTA_Y[DIRECTION.NORTH] = -1;
DIRECTION_DELTA_Y[DIRECTION.EAST] = 0;
DIRECTION_DELTA_Y[DIRECTION.SOUTH] = 1;
DIRECTION_DELTA_Y[DIRECTION.WEST] = 0;

export const getDirectionByDelta = function(deltaX, deltaY) {
    if(deltaY < 0) return DIRECTION.NORTH;
    if(deltaY > 0) return DIRECTION.SOUTH;
    if(deltaX < 0) return DIRECTION.WEST;
    if(deltaX > 0) return DIRECTION.EAST;

    return DIRECTION.EAST;
}

export const isDirectionValid = function(direction) {
    return direction >= 0 && direction < DIRECTION._COUNT;
}