import { BrushSet } from "../../../engine/map/editor/brushSet.js";
import { MapEditor } from "../../../engine/map/editor/mapEditor.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { TILE_ID } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

export const BattalionMapEditor = function() {
    MapEditor.call(this);

    const PERMUTATIONS = [
        { "origin": TILE_ID.ISLAND_1, "variants": [TILE_ID.ISLAND_2, TILE_ID.ISLAND_3, TILE_ID.ISLAND_4] },
        { "origin": TILE_ID.ROCKS_1, "variants": [TILE_ID.ROCKS_2, TILE_ID.ROCKS_3, TILE_ID.ROCKS_4] },
        { "origin": TILE_ID.SWIRL_1, "variants": [TILE_ID.SWIRL_2, TILE_ID.SWIRL_3, TILE_ID.SWIRL_4] },
    ];

    const BRUSH_SIZES = [
        { "width": 0, "height": 0 },
        { "width": 1, "height": 1 },
        { "width": 2, "height": 2 },
        { "width": 3, "height": 3 },
        { "width": 4, "height": 4 }
    ];

    this.registerPermutations(PERMUTATIONS);
    this.registerBrushSizes(BRUSH_SIZES);
    this.registerFill(BattalionMap.LAYER.GROUND, TILE_ID.GRASS);
    this.generateSets();
}

BattalionMapEditor.prototype = Object.create(MapEditor.prototype);
BattalionMapEditor.prototype.constructor = BattalionMapEditor;

BattalionMapEditor.prototype.generateSets = function() {
    const allSet = new BrushSet("MAP_EDITOR_SET_NAME_ALL");
    const canyonSet = new BrushSet("MAP_EDITOR_SET_NAME_CANYON");
    const roadSet = new BrushSet("MAP_EDITOR_SET_NAME_ROAD");
    const groundSet = new BrushSet("MAP_EDITOR_SET_NAME_GROUND");
    const shoreSet = new BrushSet("MAP_EDITOR_SET_NAME_SHORE");
    const riverSet = new BrushSet("MAP_EDITOR_SET_NAME_RIVER");
    const seaSet = new BrushSet("MAP_EDITOR_SET_NAME_SEA");

    for(let i = TILE_ID.GRASS; i < TILE_ID.COUNT; i++) {
        allSet.addValue(i);
    }

    for(let i = TILE_ID.CANYON_0; i <= TILE_ID.CANYON_47; i++) {
        canyonSet.addValue(i);
    }

    groundSet.values = [
        TILE_ID.VOLANO,
        TILE_ID.ORE_LEFT,
        TILE_ID.ORE_LEFT_USED,
        TILE_ID.ORE_LEFT_DEPLETED,
        TILE_ID.ORE_RIGHT,
        TILE_ID.ORE_RIGHT_USED,
        TILE_ID.ORE_RIGHT_DEPLETED
    ];

    for(let i = TILE_ID.SHORE_0; i <= TILE_ID.SHORE_11; i++) {
        shoreSet.addValue(i);
    }

    for(let i = TILE_ID.ROAD_0; i <= TILE_ID.ROAD_15; i++) {
        roadSet.addValue(i);
    }

    for(let i = TILE_ID.RIVER_0; i <= TILE_ID.RIVER_47; i++) {
        riverSet.addValue(i);
    }

    for(let i = TILE_ID.ISLAND_1; i <= TILE_ID.ROCKS_4; i++) {
        seaSet.addValue(i);
    }

    this.brushSets.addValue(allSet);
    this.brushSets.addValue(roadSet);
    this.brushSets.addValue(canyonSet);
    this.brushSets.addValue(groundSet);
    this.brushSets.addValue(shoreSet);
    this.brushSets.addValue(riverSet);
    this.brushSets.addValue(seaSet);
}

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