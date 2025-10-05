import { CameraContext } from "../../engine/camera/cameraContext.js";
import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { Cursor } from "../../engine/client/cursor.js";
import { BattalionCamera } from "./battalionCamera.js";
import { EditCamera } from "./editCamera.js";

export const CameraHelper = {
    tryLoadingWorldSize: function(gameContext, camera2D) {
        const { world } = gameContext;
        const { mapManager } = world;
        const activeMap = mapManager.getActiveMap();

        if(activeMap) {
            const { width, height } = activeMap;

            camera2D.setWorldSize(width, height);
            camera2D.setMapSize(width, height);
        }
    },
    createEditCamera: function(gameContext) {
        const { renderer, transform2D } = gameContext;
        const { tileWidth, tileHeight } = transform2D;

        const camera = new EditCamera();
        const context = renderer.createContext(camera);
        const contextID = context.getID();

        context.setPosition(0, 0);
        //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
        //context.setResolution(560, 560);
        //context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
        //context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);

        camera.freeViewport();
        camera.setTileSize(tileWidth, tileHeight);

        CameraHelper.tryLoadingWorldSize(gameContext, camera);
        ContextHelper.createDrag(gameContext, contextID, Cursor.BUTTON.LEFT);

        return context;
    },
    createPlayCamera: function(gameContext) {
        const { renderer, transform2D } = gameContext;
        const { tileWidth, tileHeight } = transform2D;

        const camera = new BattalionCamera();
        const context = renderer.createContext(camera);
        const contextID = context.getID();

        context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
        context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
        context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);
        context.setResolution(560, 560);
    
        camera.bindViewport();
        camera.setTileSize(tileWidth, tileHeight);
    
        CameraHelper.tryLoadingWorldSize(gameContext, camera);
        ContextHelper.createDrag(gameContext, contextID, Cursor.BUTTON.LEFT);

        return context;
    }
};