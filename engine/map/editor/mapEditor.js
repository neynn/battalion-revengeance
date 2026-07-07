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

export const MapEditor = function() {
    this.brush = new Brush();
    this.activityStack = [];
    this.fill = [];
    this.flags = MapEditor.FLAG.NONE;
    this.layerStates = [];
    this.targetLayer = WorldMap.INVALID_LAYER_ID;
    this.targetMap = null;

    this.variantFamilies = [];
    this.variantTable = [];
}

MapEditor.INVALID_FAMILY_ID = -1;

MapEditor.LAYER_STATE = {
    VISIBLE: 0,
    HIDDEN: 1,
    EDIT: 2
};

MapEditor.FLAG = {
    NONE: 0,
    USE_PERMUTATION: 1 << 0,
    USE_AUTOTILER: 1 << 1,
    INVERT_AUTOTILER: 1 << 2
};

MapEditor.prototype.paint = function(gameContext, tileX, tileY) {
    if(this.targetMap) {
        if(this.targetLayer !== WorldMap.INVALID_LAYER_ID) {
            const { tileManager } = gameContext;
            const { id, width, height } = this.brush;
            const startX = tileX - width;
            const startY = tileY - height;
            const endX = tileX + width;
            const endY = tileY + height;

            for(let i = startY; i <= endY; i++) {
                for(let j = startX; j <= endX; j++) {
                    if(this.targetMap.isTileOutOfBounds(j, i)) {
                        continue;
                    }

                    const tileID = this.getBrushTile(id);

                    if(tileManager.isVisualValid(tileID)) {
                        this.targetMap.setTile(tileID, this.targetLayer, j, i);
                        this.updateAutotilers(gameContext, j, i);
                    }
                }
            }
        }
    }
}

MapEditor.prototype.initVariantTable = function(count) {
    this.variantTable.length = 0;

    for(let i = 0; i < count; i++) {
        this.variantTable[i] = MapEditor.INVALID_FAMILY_ID;
    }
}

MapEditor.prototype.registerVariantFamily = function(begin, end) {
    if(begin < 0 || end < begin || end >= this.variantTable.length) {
        return;
    }

    const familyID = this.variantFamilies.length;
    const family = [];

    for(let i = begin; i <= end; i++) {
        this.variantTable[i] = familyID;

        family.push(i);
    }

    this.variantFamilies[familyID] = family;
}

MapEditor.prototype.getBrushTile = function(tileID) {
    if((this.flags & MapEditor.FLAG.USE_PERMUTATION)) {
        if(tileID >= 0 && tileID < this.variantTable.length) {
            const familyID = this.variantTable[tileID];

            if(familyID !== MapEditor.INVALID_FAMILY_ID) {
                return getRandomElement(this.variantFamilies[this.variantTable[tileID]]);
            }
        }
    }

    return tileID;
}

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0 || !this.targetMap) {
        return;
    }

    const { actions } = this.activityStack.pop();

    for(const { layerID, tileX, tileY, oldID } of actions) {
        this.targetMap.setTile(oldID, layerID, tileX, tileY);
    }
}

MapEditor.prototype.updateAutotilers = function(gameContext, tileX, tileY) {
    const { tileManager } = gameContext;

    if(this.targetMap && (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
        const startX = tileX - 1;
        const startY = tileY - 1;
        const endX = tileX + 1;
        const endY = tileY + 1;
        const isInverted = (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0;

        for(let i = startY; i <= endY; i++) {
            for(let j = startX; j <= endX; j++) {
                const tileID = this.targetMap.getTile(this.targetLayer, j, i);
                const autotiler = tileManager.getAutotilerFromTile(tileID);

                if(autotiler) {
                    this.targetMap.applyAutotiler(autotiler, j, i, this.targetLayer, isInverted);
                }
            }
        }
    }
}

MapEditor.prototype.useAutotiler = function(autotiler, tileX, tileY) {
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

MapEditor.prototype.getLayerState = function(layerID) {
    if(layerID < 0 || layerID >= this.layerStates.length) {
        return MapEditor.LAYER_STATE.VISIBLE;
    }
    
    return this.layerStates[layerID];
}

MapEditor.prototype.resetLayerStates = function() {
    for(let i = 0; i < this.layerStates.length; i++) {
        this.layerStates[i] = MapEditor.LAYER_STATE.VISIBLE;
        this.targetMap.setLayerAlpha(i, 1);
    }

    this.targetLayer = WorldMap.INVALID_LAYER_ID;
}

MapEditor.prototype.toggleLayerState = function(layerID) {
    if(layerID < 0 || layerID >= this.layerStates.length) {
        return MapEditor.LAYER_STATE.VISIBLE;
    }

    switch(this.layerStates[layerID]) {
        case MapEditor.LAYER_STATE.VISIBLE: {
            this.layerStates[layerID] = MapEditor.LAYER_STATE.EDIT;

            if(this.targetLayer !== WorldMap.INVALID_LAYER_ID) {
                this.layerStates[this.targetLayer] = MapEditor.LAYER_STATE.VISIBLE;
            }

            this.targetLayer = layerID;
            this.targetMap.setLayerAlpha(layerID, 1);

            for(let i = 0; i < this.layerStates.length; i++) {
                if(this.layerStates[i] === MapEditor.LAYER_STATE.VISIBLE) {
                    this.targetMap.setLayerAlpha(i, 0.5);
                }
            }

            break;
        }
        case MapEditor.LAYER_STATE.HIDDEN: {
            this.layerStates[layerID] = MapEditor.LAYER_STATE.VISIBLE;

            if(this.targetLayer === WorldMap.INVALID_LAYER_ID) {
                this.targetMap.setLayerAlpha(layerID, 1);
            } else {
                this.targetMap.setLayerAlpha(layerID, 0.5);
            }

            break;
        }
        case MapEditor.LAYER_STATE.EDIT: {
            this.layerStates[layerID] = MapEditor.LAYER_STATE.HIDDEN;
            this.targetMap.setLayerAlpha(layerID, 0);
            this.targetLayer = WorldMap.INVALID_LAYER_ID;

            for(let i = 0; i < this.layerStates.length; i++) {
                if(this.layerStates[i] === MapEditor.LAYER_STATE.VISIBLE) {
                    this.targetMap.setLayerAlpha(i, 1);
                }
            }

            break;
        }
    }

    return this.layerStates[layerID];
}

MapEditor.prototype.togglePermutation = function() {
    this.flags ^= MapEditor.FLAG.USE_PERMUTATION;
}

MapEditor.prototype.toggleInversion = function() {
    //Only toggle if using autotiler.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
        this.flags ^= MapEditor.FLAG.INVERT_AUTOTILER;
    }
}

MapEditor.prototype.toggleAutotiling = function() {
    this.flags ^= MapEditor.FLAG.USE_AUTOTILER;

    //If disabling autotiler, then also disable inverting.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) === 0) {
        this.flags &= (~MapEditor.FLAG.INVERT_AUTOTILER);
    }
}

MapEditor.prototype.isRandomized = function() {
    return (this.flags & MapEditor.FLAG.USE_PERMUTATION) !== 0;
}

MapEditor.prototype.isInverted = function() {
    return (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0;
}

MapEditor.prototype.isAutotiling = function() {
    return (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0;
}

MapEditor.prototype.isErasing = function() {
    return this.brush.id === TileManager.TILE_ID.EMPTY;
}

MapEditor.prototype.toggleEraser = function() {
    this.brush.toggleEraser();
}

MapEditor.prototype.setBrush = function(id, name) {
    this.brush.setBrush(id, name);
}

MapEditor.prototype.resetBrush = function() {
    this.brush.reset();
}

MapEditor.prototype.setTargetMap = function(worldMap) {
    const { layers } = worldMap;

    this.activityStack.length = 0;
    this.layerStates.length = 0;
    this.targetMap = worldMap;

    for(let i = 0; i < layers.length; i++) {
        this.layerStates[i] = MapEditor.LAYER_STATE.VISIBLE;
    }

    this.targetLayer = WorldMap.INVALID_LAYER_ID;
}

MapEditor.prototype.removeTargetMap = function() {
    this.targetMap = null;
    this.targetLayer = WorldMap.INVALID_LAYER_ID;
}

MapEditor.prototype.registerFill = function(layerID, value) {
    for(let i = 0; i < this.fill.length; i++) {
        if(this.fill[i].layerID === layerID) {
            this.fill[i].value = value;
            return;
        }
    }

    const fill = createFill();

    fill.layerID = layerID;
    fill.value = value;

    this.fill.push(fill);
}