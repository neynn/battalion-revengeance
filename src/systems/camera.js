import { Cursor } from "../../engine/client/cursor.js";
import { Scroller } from "../../engine/util/scroller.js";
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

export const addZoom = function(gameContext, cContext) {
    const { client } = gameContext;
    const { cursor } = client;
    const scaleFactors = new Scroller(1);

    scaleFactors.setValues([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => {
        let scale = 1;

        switch(direction) {
            case Cursor.SCROLL.UP: {
                scale = scaleFactors.scroll(1);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                scale = scaleFactors.scroll(-1);
                break;
            }
        }

        //TODO: Maybe memory leak, because context is kept on heap.
        cContext.setScale(scale);
    });
}

export const createEditCamera = function(gameContext, brush) {
    const { renderer, transform2D } = gameContext;
    const { tileWidth, tileHeight } = transform2D;

    const camera = new EditCamera(brush);
    const context = renderer.createContext(camera);

    camera.freeViewport();
    camera.setTileSize(tileWidth, tileHeight);

    tryLoadingWorldSize(gameContext, camera);

    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.forceReload();
    camera.reloadViewport();

    addZoom(gameContext, context);

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

    context.setScale(1);
    context.forceReload();
    camera.reloadViewport();

    addZoom(gameContext, context);

    context.root.addChild(document.getElementById("DialogueBox"));

    return context;
}