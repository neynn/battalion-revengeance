import { Cursor } from "../../engine/client/cursor/cursor.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../engine/engine_constants.js";
import { Scroller } from "../../engine/util/scroller.js";
import { BattalionCamera } from "../camera/battalionCamera.js";
import { EditCamera } from "../camera/editCamera.js";

export const addZoom = function(gameContext, cContext) {
    const { client } = gameContext;
    const { cursor } = client;
    const scaleFactors = new Scroller(1);

    scaleFactors.setValues([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10]);
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
    const { renderer } = gameContext;
    const camera = new EditCamera(brush);
    const context = renderer.createContext(camera);

    camera.freeViewport();
    camera.setTileSize(TILE_WIDTH, TILE_HEIGHT);
    camera.tryLoadingWorldSize(gameContext);

    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.forceReload();
    camera.reloadViewport();

    //addZoom(gameContext, context);

    return context;
}

export const createPlayCamera = function(gameContext) {
    const { renderer } = gameContext;
    const camera = new BattalionCamera();
    const context = renderer.createContext(camera);

    camera.flags |= BattalionCamera.FLAG.USE_PERSPECTIVES;
    camera.bindViewport();
    camera.setTileSize(TILE_WIDTH, TILE_HEIGHT);
    camera.loadSprites(gameContext);
    camera.tryLoadingWorldSize(gameContext);

    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.enableAutoCenter();

    context.fixBuffer();
    context.setResolution(560, 560);

    context.setScale(1);
    context.forceReload();
    camera.reloadViewport();

    addZoom(gameContext, context);

    return context;
}