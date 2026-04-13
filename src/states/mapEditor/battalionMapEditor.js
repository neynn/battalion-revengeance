import { createActivity, createBrushAction, MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

export const BattalionMapEditor = function() {
    MapEditor.call(this);

    this.initVariants();
    this.registerFill(BattalionMap.LAYER.GROUND, TILE_ID.GRASS);
}

BattalionMapEditor.prototype = Object.create(MapEditor.prototype);
BattalionMapEditor.prototype.constructor = BattalionMapEditor;

BattalionMapEditor.prototype.initVariants = function() {
    const island = [TILE_ID.ISLAND_1, TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4];
    const rocks = [TILE_ID.ROCKS_1, TILE_ID.ROCKS_2, TILE_ID.ROCKS_3, TILE_ID.ROCKS_4];
    const swirl = [TILE_ID.SWIRL_1, TILE_ID.SWIRL_2, TILE_ID.SWIRL_3, TILE_ID.SWIRL_4];

    for(const variants of [island, rocks, swirl]) {
        for(const origin of variants) {
            this.registerVariants(origin, variants);
        }
    }
}

BattalionMapEditor.prototype.onPaint = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;
    const { id, width, height } = this.brush;
    const autotiler = tileManager.getAutotilerByVisual(id);
    const brushID = this.getBrushTile();
    const activity = createActivity();

    const startX = tileX - width;
    const startY = tileY - height;
    const endX = tileX + width;
    const endY = tileY + height;

    activity.mapID = this.targetMap.getID();

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const tileID = this.targetMap.getTile(this.targetLayer, j, i);

            if(tileID !== TileManager.TILE_ID.INVALID && tileID !== brushID) {
                this.targetMap.placeTile(brushID, this.targetLayer, j, i);

                const action = createBrushAction();

                action.layerID = this.targetLayer;
                action.tileX = j;
                action.tileX = i;
                action.oldID = tileID;

                activity.actions.push(action);
            }

            if(autotiler) {
                this.applyAutotiler(autotiler, j, i);
            }
        }
    }

    if(activity.actions.length !== 0) {
        this.activityStack.push(activity);
    }
}