import { ContextHelper } from "../../../engine/camera/contextHelper.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { getTileID } from "../../enums.js";
import { ArmyMap } from "../../init/armyMap.js";

export const ArmyMapEditor = function() {
    MapEditor.call(this);
}

ArmyMapEditor.prototype = Object.create(MapEditor.prototype);
ArmyMapEditor.prototype.constructor = ArmyMapEditor;

ArmyMapEditor.prototype.updateType = function(gameContext, worldMap, tileX, tileY, tileID) {
    const { tileManager } = gameContext;
    const tileMeta = tileManager.getMeta(tileID);

    if(tileMeta) {
        const { type } = tileMeta;

        if(type !== undefined) {
            const typeID = getTileID(type);

            worldMap.placeTile(typeID, ArmyMap.LAYER.TYPE, tileX, tileY);
        }
    }
}

ArmyMapEditor.prototype.paint = function(gameContext, layerID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const { x, y } = ContextHelper.getMouseTile(gameContext);
    const autotiler = tileManager.getAutotilerByTile(this.brush.id);
    const actionsTaken = [];
    
    this.brush.paint(x, y, (tileX, tileY, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== null && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            this.updateType(gameContext, worldMap, tileX, tileY, brushID);

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
                        this.updateType(gameContext, worldMap, j, i, nextID);
                    }
                }
            }
        }
    });

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": this.mapID,
            "mode": this.modes.getValue(),
            "actions": actionsTaken
        });
    }
}