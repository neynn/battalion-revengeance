import { Cursor } from "../client/cursor.js";
import { CameraContext } from "./cameraContext.js";

export const ContextHelper = {
    getContextAtMouse: function(gameContext) {
        const { renderer, client } = gameContext;
        const { cursor } = client;
        const context = renderer.getCollidedContext(cursor.positionX, cursor.positionY, cursor.radius);

        return context;
    },
    createDrag: function(gameContext, contextID, mouseButton = Cursor.BUTTON.LEFT) {
        const { client, renderer } = gameContext;
        const { cursor } = client;
        const context = renderer.getContext(contextID);

        if(!context) {
            return;
        }

        cursor.events.on(Cursor.EVENT.BUTTON_DOWN, ({ button, x, y, radius }) => {
            if(button === mouseButton) {
                const isColliding = context.isColliding(x, y, radius);

                if(isColliding) {
                    context.enableDrag();
                }
            }
        });

        cursor.events.on(Cursor.EVENT.BUTTON_DRAG, ({ button, deltaX, deltaY }) => {
            if(button === mouseButton) {
                context.dragCamera(deltaX, deltaY);
            }
        });

        cursor.events.on(Cursor.EVENT.BUTTON_UP, ({ button }) => {
            if(button === mouseButton) {
                context.disableDrag();
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
    },
    toNative: function(gameContext, contextID) {
        const { renderer } = gameContext;
        const context = renderer.getContext(contextID);

        if(context) {
            context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT);
        }
    },
    toFixed: function(gameContext, contextID, width, height) {
        const { renderer } = gameContext;
        const context = renderer.getContext(contextID);

        if(context) {
            context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
            context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);
            context.setResolution(width, height);
        }
    }
};