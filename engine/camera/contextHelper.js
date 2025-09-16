import { Cursor } from "../client/cursor.js";

export const ContextHelper = {
    getContextAtMouse: function(gameContext) {
        const { renderer, client } = gameContext;
        const { cursor } = client;
        const context = renderer.getCollidedContext(cursor.positionX, cursor.positionY, cursor.radius);

        return context;
    },
    createDrag: function(gameContext, mouseButton = Cursor.BUTTON.LEFT) {
        const { client } = gameContext;
        const { cursor } = client;

        cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
            if(buttonID === mouseButton) {
                const context = ContextHelper.getContextAtMouse(gameContext);

                if(context) {
                    context.dragCamera(deltaX, deltaY);
                }
            }
        });
    },
    getMouseTile: function(gameContext) {
        const context = ContextHelper.getContextAtMouse(gameContext);

        if(!context) {
            return {
                "x": -1,
                "y": -1
            }
        }

        const { transform2D, client } = gameContext;
        const { cursor } = client;
        const { x, y } = context.getWorldPosition(cursor.positionX, cursor.positionY);
        const mouseTile = transform2D.transformWorldToTile(x, y);

        return mouseTile;
    },
    getMousePosition: function(gameContext) {
        const { client } = gameContext;
        const { cursor } = client;
        const context = ContextHelper.getContextAtMouse(gameContext);

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
};