import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

export const BattalionMapEditor = function() {
    MapEditor.call(this);

    const PERMUTATIONS = [
        { "origin": TILE_ID.ISLAND_1, "variants": [TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4] }
    ];

    const SETS = [
        { "name": "BASE", "values": [TILE_ID.GRASS, TILE_ID.BOREAL, TILE_ID.ARCTIC] },
        { "name": "LAND", "values": [TILE_ID.ROAD_0, TILE_ID.VOLANO] },
        { "name": "WATER", "values": [TILE_ID.RIVER_0, TILE_ID.ROCKS_1, TILE_ID.ROCKS_2, TILE_ID.ROCKS_3, TILE_ID.ROCKS_4, TILE_ID.ISLAND_1, TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4, TILE_ID.SWIRL_1, TILE_ID.SWIRL_2, TILE_ID.SWIRL_3, TILE_ID.SWIRL_4, TILE_ID.SHORE_0, TILE_ID.SHORE_1, TILE_ID.SHORE_2, TILE_ID.SHORE_3, TILE_ID.SHORE_4, TILE_ID.SHORE_5, TILE_ID.SHORE_6, TILE_ID.SHORE_7, TILE_ID.SHORE_8, TILE_ID.SHORE_9, TILE_ID.SHORE_10, TILE_ID.SHORE_11] }
    ];

    const BRUSH_SIZES = [
        { "width": 0, "height": 0 },
        { "width": 1, "height": 1 },
        { "width": 2, "height": 2 },
        { "width": 3, "height": 3 },
        { "width": 4, "height": 4 }
    ];

    this.registerPermutations(PERMUTATIONS);
    this.registerBrushSets(SETS);
    this.registerBrushSizes(BRUSH_SIZES);
    this.registerFill(BattalionMap.LAYER.GROUND, TILE_ID.GRASS);
}

BattalionMapEditor.prototype = Object.create(MapEditor.prototype);
BattalionMapEditor.prototype.constructor = BattalionMapEditor;

BattalionMapEditor.prototype.onTilePaint = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;
    const { id, width, height } = this.brush;
    const autotiler = tileManager.getAutotilerByTile(id);
    const brushID = this.getBrushTile();
    const actionsTaken = [];

    const startX = tileX - width;
    const startY = tileY - height;
    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const tileID = this.targetMap.getTile(this.targetLayer, j, i);

            if(tileID !== TileManager.TILE_ID.INVALID && tileID !== brushID) {
                this.targetMap.placeTile(brushID, this.targetLayer, j, i);

                actionsTaken.push({
                    "layerID": this.targetLayer,
                    "tileX": j,
                    "tileY": i,
                    "oldID": tileID
                });
            }

            if(autotiler) {
                this.applyAutotiler(autotiler, j, i);
            }
        }
    }

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": this.targetMap.getID(),
            "mode": this.modes.getValue(),
            "actions": actionsTaken
        });
    }
}