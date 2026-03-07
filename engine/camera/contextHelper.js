import { transformWorldToTile } from "../math/transform2D.js";

const getContextAtMouse = function(gameContext) {
    const { renderer, client } = gameContext;
    const { cursor } = client;
    const context = renderer.getCollidedContext(cursor.positionX, cursor.positionY, cursor.radius);

    return context;
}

export const getCursorPosition = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;
    const context = getContextAtMouse(gameContext);

    if(!context) {
        return {
            "x": -1,
            "y": -1,
            "r": cursor.radius
        }
    }

    const { x, y } = context.getWorldPosition(cursor.positionX, cursor.positionY);

    return {
        "x": x,
        "y": y,
        "r": cursor.radius
    };
}

export const getCursorTile = function(gameContext) {
    const context = getContextAtMouse(gameContext);

    if(!context) {
        return {
            "x": -1,
            "y": -1
        }
    }

    const { client } = gameContext;
    const { cursor } = client;
    const { x, y } = context.getWorldPosition(cursor.positionX, cursor.positionY);
    const mouseTile = transformWorldToTile(x, y);

    return mouseTile;
}