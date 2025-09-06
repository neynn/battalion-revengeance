import { CameraContext } from "../../engine/camera/cameraContext.js";
import { Cursor } from "../../engine/client/cursor.js";
import { BattalionCamera } from "./battalionCamera.js";
import { EditCamera } from "./editCamera.js";

const EDIT_CAMERA_ID = "EDIT";
const PLAY_CAMERA_ID = "PLAY";

export const CameraHelper = {
    destroyPlayCamera: function(gameContext) {
        const { renderer } = gameContext;

        renderer.destroyContext(PLAY_CAMERA_ID);
    },
    destroyEditCamera: function(gameContext) {
        const { renderer } = gameContext;

        renderer.destroyContext(EDIT_CAMERA_ID);
    },  
    tryLoadingWorldSize: function(gameContext, camera2D) {
        const { world } = gameContext;
        const { mapManager } = world;
        const activeMap = mapManager.getActiveMap();

        if(activeMap) {
            const { width, height } = activeMap;

            camera2D.setWorldSize(width, height);
        }
    },
    createEditCamera: function(gameContext) {
        const { renderer, transform2D } = gameContext;
        const { tileWidth, tileHeight } = transform2D;

        const camera = new EditCamera();
        const context = renderer.createContext(EDIT_CAMERA_ID, camera);
        
        context.setPosition(0, 0);
        //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
        //context.setResolution(560, 560);
        //context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
        //context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);

        camera.freeViewport();
        camera.setTileSize(tileWidth, tileHeight);

        CameraHelper.tryLoadingWorldSize(gameContext, camera);
        CameraHelper.createDrag(gameContext);

        return camera;
    },
    createPlayCamera: function(gameContext) {
        const { renderer, transform2D } = gameContext;
        const { tileWidth, tileHeight } = transform2D;

        const camera = new BattalionCamera();
        const context = renderer.createContext(PLAY_CAMERA_ID, camera);
        
        context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
        context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
        context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);
        context.setResolution(560, 560);
    
        camera.bindViewport();
        camera.setTileSize(tileWidth, tileHeight);
    
        CameraHelper.tryLoadingWorldSize(gameContext, camera);
        CameraHelper.createDrag(gameContext);

        return camera;
    },
    createDrag: function(gameContext) {
        const { client } = gameContext;
        const { cursor } = client;

        cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
            if(buttonID === Cursor.BUTTON.LEFT) {
                const context = gameContext.getContextAtMouse();

                if(context) {
                    context.dragCamera(deltaX, deltaY);
                }
            }
        });
    }
};