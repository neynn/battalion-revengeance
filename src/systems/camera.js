import { CameraContext } from "../../engine/camera/cameraContext.js";
import { Cursor } from "../../engine/client/cursor.js";
import { BattalionCamera } from "../camera/battalionCamera.js";
import { EditCamera } from "../camera/editCamera.js";

const tryLoadingWorldSize = function(gameContext, camera2D) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(activeMap) {
        const { width, height } = activeMap;

        camera2D.setWorldSize(width, height);
        camera2D.setMapSize(width, height);
    }
}

export const createEditCamera = function(gameContext, brush) {
    const { renderer, transform2D } = gameContext;
    const { tileWidth, tileHeight } = transform2D;

    const camera = new EditCamera(brush);
    const context = renderer.createContext(camera);

    camera.freeViewport();
    camera.setTileSize(tileWidth, tileHeight);

    tryLoadingWorldSize(gameContext, camera);

    context.setPosition(0, 0);
    context.setDragButton(Cursor.BUTTON.LEFT);

    return context;
}

export const createPlayCamera = function(gameContext) {
    const { renderer, transform2D } = gameContext;
    const { tileWidth, tileHeight } = transform2D;

    const camera = new BattalionCamera();
    const context = renderer.createContext(camera);

    camera.bindViewport();
    camera.setTileSize(tileWidth, tileHeight);
    camera.loadSprites(gameContext);

    tryLoadingWorldSize(gameContext, camera);

    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.enableAutoCenter();

    //context.fixBuffer();
    //context.setResolution(560, 560);

    context.setScale(2);
    context.forceReload();
    camera.reloadViewport();

    context.root.addChild(document.getElementById("DialogueBox"));

    return context;
}