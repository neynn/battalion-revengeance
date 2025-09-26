import { MapEditor } from "../../engine/map/editor/mapEditor.js";

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
    
    this.brush.paint(x, y, (tileX, tileY, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== -1 && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            actionsTaken.push({
                "layerID": layerID,
                "tileX": tileX,
                "tileY": tileY,
                "oldID": tileID
            });
        }

        if(this.autotilerState !== MapEditor.AUTOTILER_STATE.INACTIVE && autotiler) {
            const startX = tileX - 1;
            const startY = tileY - 1;
            const endX = tileX + 1;
            const endY = tileY + 1;
            const isInverted = this.autotilerState === MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED;

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