import { MapEditor } from "../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../engine/tile/tileManager.js";

export const BattalionMapEditor = function() {
    MapEditor.call(this);
}

BattalionMapEditor.prototype = Object.create(MapEditor.prototype);
BattalionMapEditor.prototype.constructor = BattalionMapEditor;

BattalionMapEditor.prototype.onPaint = function(gameContext, worldMap, position, layerID) {
    const { tileManager } = gameContext;
    const { x, y } = position;
    const autotiler = tileManager.getAutotilerByTile(this.brush.id);
    const actionsTaken = [];
    const mapID = worldMap.getID();
    const brushID = this.getBrushID();

    this.brush.paint(x, y, (tileX, tileY) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== TileManager.TILE_ID.INVALID && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            actionsTaken.push({
                "layerID": layerID,
                "tileX": tileX,
                "tileY": tileY,
                "oldID": tileID
            });
        }

        if(autotiler && (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
            const startX = tileX - 1;
            const startY = tileY - 1;
            const endX = tileX + 1;
            const endY = tileY + 1;
            const isInverted = (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0;

            for(let i = startY; i <= endY; i++) {
                for(let j = startX; j <= endX; j++) {
                    worldMap.applyAutotiler(autotiler, j, i, layerID, isInverted);
                }
            }
        }
    });

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": mapID,
            "mode": this.modes.getValue(),
            "actions": actionsTaken
        });
    }
}