import { getRandomElement } from "../../math/math.js";
import { TileManager } from "../../tile/tileManager.js";
import { WorldMap } from "../worldMap.js";
import { Brush } from "./brush.js";

export const createFill = function() {
    return {
        "layerID": WorldMap.INVALID_LAYER_ID,
        "value": TileManager.TILE_ID.INVALID
    }
}

export const createBrushAction = function() {
    return {
        "layerID": WorldMap.INVALID_LAYER_ID,
        "tileX": WorldMap.OUT_OF_BOUNDS,
        "tileY": WorldMap.OUT_OF_BOUNDS,
        "oldID": TileManager.TILE_ID.INVALID
    }
}

export const createActivity = function() {
    return {
        "mapID": null,
        "actions": []
    }
}

export const MapEditor = function() {
    this.brush = new Brush();
    this.activityStack = [];
    this.permutations = {};
    this.fill = [];
    this.flags = MapEditor.FLAG.NONE;
    this.targetLayer = WorldMap.INVALID_LAYER_ID;
    this.targetMap = null;
}

MapEditor.FLAG = {
    NONE: 0,
    USE_PERMUTATION: 1 << 0,
    USE_AUTOTILER: 1 << 1,
    INVERT_AUTOTILER: 1 << 2
};

MapEditor.prototype.onPaint = function(gameContext, tileX, tileY) {}

MapEditor.prototype.paint = function(gameContext, tileX, tileY) {
    if(this.targetMap) {
        if(this.targetLayer !== WorldMap.INVALID_LAYER_ID) {
            this.onPaint(gameContext, tileX, tileY);
        }
    }
}

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const { mapID, actions } = this.activityStack.pop();
    const worldMap = mapManager.getMap(mapID);

    if(worldMap) {
        for(const { layerID, tileX, tileY, oldID } of actions) {
            worldMap.placeTile(oldID, layerID, tileX, tileY);
        }
    }
}

MapEditor.prototype.applyAutotiler = function(autotiler, tileX, tileY) {
    if(this.targetMap && (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
        const startX = tileX - 1;
        const startY = tileY - 1;
        const endX = tileX + 1;
        const endY = tileY + 1;
        const isInverted = (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0;

        for(let i = startY; i <= endY; i++) {
            for(let j = startX; j <= endX; j++) {
                this.targetMap.applyAutotiler(autotiler, j, i, this.targetLayer, isInverted);
            }
        }
    }
}

MapEditor.prototype.autofillMap = function() {
    if(!this.targetMap) {
        return;
    }

    for(let i = 0; i < this.fill.length; i++) {
        const { layerID, value } = this.fill[i];

        this.targetMap.getLayer(layerID).fill(value);
    }
}

MapEditor.prototype.getBrushArea = function() {
    const { width, height } = this.brush;

    return `${(width + 1) * 2 - 1}x${(height + 1) * 2 - 1}`;
}

MapEditor.prototype.getBrushTile = function() {
    if((this.flags & MapEditor.FLAG.USE_PERMUTATION)) {
        return this.getPermutation(this.brush.id);
    }

    return this.brush.id;
}

MapEditor.prototype.getPermutation = function(originID) {
    const permutations = this.permutations[originID];

    if(permutations === undefined || permutations.length === 0) {
        return originID;
    }

    return getRandomElement(permutations);
}

MapEditor.prototype.togglePermutation = function() {
    this.flags ^= MapEditor.FLAG.USE_PERMUTATION;

    return (this.flags & MapEditor.FLAG.USE_PERMUTATION) !== 0;
}

MapEditor.prototype.toggleInversion = function() {
    //Only toggle if using autotiler.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
        this.flags ^= MapEditor.FLAG.INVERT_AUTOTILER;
    }

    return (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0;
}

MapEditor.prototype.toggleAutotiling = function() {
    this.flags ^= MapEditor.FLAG.USE_AUTOTILER;

    //If disabling autotiler, then also disable inverting.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) === 0) {
        this.flags &= (~MapEditor.FLAG.INVERT_AUTOTILER);
    }

    return (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0;
}

MapEditor.prototype.toggleEraser = function() {
    const isErasing = this.brush.toggleEraser();

    return isErasing;
}

MapEditor.prototype.setBrush = function(id, name) {
    this.brush.setBrush(id, name);
}

MapEditor.prototype.resetBrush = function() {
    this.brush.reset();
}

MapEditor.prototype.setTargetMap = function(worldMap) {
    this.targetMap = worldMap;
}

MapEditor.prototype.removeTargetMap = function() {
    this.targetMap = null;
}

MapEditor.prototype.setTargetLayer = function(layerID) {
    this.targetLayer = layerID;
}

MapEditor.prototype.removeTargetLayer = function() {
    this.targetLayer = WorldMap.INVALID_LAYER_ID;
}

MapEditor.prototype.registerFill = function(layerID, value) {
    for(let i = 0; i < this.fill.length; i++) {
        if(this.fill[i].layerID === layerID) {
            return;
        }
    }

    const fill = createFill();

    fill.layerID = layerID;
    fill.value = value;

    this.fill.push(fill);
}

MapEditor.prototype.registerVariants = function(originID, variants) {
    if(variants.length === 0) {
        return;
    }

    let permutations = this.permutations[originID];

    if(permutations === undefined) {
        permutations = [];
        this.permutations[originID] = permutations;
    }

    for(const mutationID of variants) {
        if(!permutations.includes(mutationID)) {
            permutations.push(mutationID);
        }
    }
}