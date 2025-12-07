import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { TILE_ID } from "../../enums.js";

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

    this.loadPermutations(PERMUTATIONS);
    this.loadBrushSets(SETS);
    this.loadBrushSizes(BRUSH_SIZES);
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