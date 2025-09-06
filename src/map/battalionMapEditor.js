import { MapEditor } from "../../engine/map/mapEditor.js";
import { TileHelper } from "../tile/tileHelper.js";

export const BattalionMapEditor = function() {
    MapEditor.call(this);
}

BattalionMapEditor.prototype = Object.create(MapEditor.prototype);
BattalionMapEditor.prototype.constructor = BattalionMapEditor;

BattalionMapEditor.prototype.updateFlags = function(gameContext, worldMap, tileX, tileY, newTile, oldTile) {
    const { tileManager } = gameContext;
    const oldMeta = tileManager.getMeta(oldTile);
    const newMeta = tileManager.getMeta(newTile);

    if(oldMeta) {
        const { flag } = oldMeta;
        
        if(flag !== undefined) {
            const tileFlag = TileHelper.getTileFlag(flag);

            worldMap.removeTileFlag(tileX, tileY, tileFlag);
        }
    }

    if(newMeta) {
        const { flag } = newMeta;

        if(flag !== undefined) {
            const tileFlag = TileHelper.getTileFlag(flag);

            worldMap.setTileFlag(tileX, tileY, tileFlag);
        }
    }
}

BattalionMapEditor.prototype.paint = function(gameContext, mapID, layerID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getMap(mapID);

    if(!worldMap) {
        return;
    }

    const { x, y } = gameContext.getMouseTile();
    const autotiler = tileManager.getAutotilerByTile(this.brush.id);
    const actionsTaken = [];
    
    this.brush.paint(x, y, (tileX, tileY, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== -1 && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            this.updateFlags(gameContext, worldMap, tileX, tileY, brushID, tileID);

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
                    const previousID = worldMap.getTile(layerID, j, i);

                    worldMap.applyAutotiler(autotiler, j, i, layerID, isInverted);

                    const nextID = worldMap.getTile(layerID, j, i);

                    if(previousID !== nextID) {
                        this.updateFlags(gameContext, worldMap, j, i, nextID, previousID);
                    }
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