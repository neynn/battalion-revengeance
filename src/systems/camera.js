import { Cursor } from "../../engine/client/cursor/cursor.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../engine/engine_constants.js";
import { Scroller } from "../../engine/util/scroller.js";
import { BattalionRenderer2D } from "../camera/battalionRenderer2D.js";
import { EditRenderer2D } from "../camera/editRenderer2D.js";

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
    const editRenderer = new EditRenderer2D(brush);
    const context = renderer.createContext();
    
    context.renderer = editRenderer;
    context.camera.freeViewport();
    context.camera.setTileSize(TILE_WIDTH, TILE_HEIGHT);
    
    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    context.forceReload();
    context.camera.reloadViewport();

    //addZoom(gameContext, context);

    return context;
}

export const createPlayCamera = function(gameContext) {
    const { renderer } = gameContext;
    const battalionRenderer = new BattalionRenderer2D();
    const context = renderer.createContext();

    battalionRenderer.flags |= BattalionRenderer2D.FLAG.USE_PERSPECTIVES;

    context.renderer = battalionRenderer;
    context.camera.bindViewport();
    context.camera.setTileSize(TILE_WIDTH, TILE_HEIGHT);

    context.setDragButton(Cursor.BUTTON.LEFT);
    context.enableBuffer();
    //context.enableAutoCenter(); -> Done in PlayUI!
    context.fixBuffer(560, 560);
    context.setScale(1);
    context.forceReload();
    context.camera.reloadViewport();

    addZoom(gameContext, context);

    return context;
}