import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { DEBUG } from "../../engine/debug.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { LAYER_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { BattalionRenderer2D } from "./battalionRenderer2D.js";

export const EditRenderer2D = function(brush) {
    BattalionRenderer2D.call(this);

    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
    this.brush = brush;
}

EditRenderer2D.prototype = Object.create(BattalionRenderer2D.prototype);
EditRenderer2D.prototype.constructor = EditRenderer2D;

EditRenderer2D.prototype.render = function(gameContext, camera, display) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    camera.updateWorldBounds(worldMap.width, worldMap.height);

    this.drawLayer(camera, tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(camera, tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawLayer(camera, tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));

    if(this.showAllJammers) {
        this.drawJammers(camera, tileManager, display, worldMap);
    }

    this.drawEntities(gameContext, camera, display, worldMap);
    this.drawSpriteLayer(gameContext, camera, display, LAYER_TYPE.BUILDING);
    this.drawHoverTile(gameContext, camera, display);

    if(DEBUG.WORLD) {
        this.debugMap(camera, display, worldMap);
    }
}

EditRenderer2D.prototype.drawHoverTile = function(gameContext, camera, display) {
    const { context } = display;
    const { id, name, width, height } = this.brush;

    if(id === TileManager.TILE_ID.INVALID) {
        return;
    }

    const { tileManager } = gameContext;
    const { x, y } = getCursorTile(gameContext);

    context.globalAlpha = this.overlayAlpha;
    context.fillStyle = this.overlayColor;
    context.textAlign = "center";

    const startX = x - width;
    const startY = y - height;
    const endX = x + width;
    const endY = y + height;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const screenX = camera.getScreenX(j);
            const screenY = camera.getScreenY(i);

            this.drawTile(tileManager, id, context, screenX, screenY);

            context.fillText(name, screenX + this.halfTileWidth, screenY);
        }
    }
}