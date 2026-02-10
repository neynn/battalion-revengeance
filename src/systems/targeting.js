import { getDirectionVector } from "./direction.js";

export const getLineEntities = function(gameContext, direction, startX, startY, maxRange) {
    const { world } = gameContext;
    const { x, y } = getDirectionVector(direction);

    if(x === 0 && y === 0) {
        console.error("Faulty direction!");
        return [];
    }

    return world.getEntitiesInLine(startX, startY, x, y, maxRange);
}