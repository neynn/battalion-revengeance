import { getRandomElement } from "../../math/math.js";
import { Scroller } from "../../util/scroller.js";
import { WorldMap } from "../worldMap.js";
import { Brush } from "./brush.js";
import { BrushSet } from "./brushSet.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.brushSets = new Scroller(new BrushSet("INVALID", []));
    this.brushSizes = new Scroller({ "width": 0, "height": 0 });
    this.modes = new Scroller(MapEditor.MODE.TILE);
    this.activityStack = [];
    this.permutations = {};
    this.fill = [];
    this.flags = MapEditor.FLAG.NONE | MapEditor.FLAG.USE_PERMUTATION;
    this.modes.setValues([MapEditor.MODE.TILE, MapEditor.MODE.ENTITY]);
    this.targetLayer = WorldMap.INVALID_LAYER_ID;
    this.targetMap = null;
}

MapEditor.FLAG = {
    NONE: 0,
    USE_PERMUTATION: 1 << 0,
    USE_AUTOTILER: 1 << 1,
    INVERT_AUTOTILER: 1 << 2
};

MapEditor.MODE = {
    TILE: 0,
    ENTITY: 1
};

MapEditor.prototype.onEntityPaint = function(gameContext, tileX, tileY) {}

MapEditor.prototype.onTilePaint = function(gameContext, tileX, tileY) {}

MapEditor.prototype.paint = function(gameContext, tileX, tileY) {
    if(!this.targetMap) {
        return;
    }

    switch(this.modes.getValue()) {
        case MapEditor.MODE.TILE: {
            if(this.targetLayer !== WorldMap.INVALID_LAYER_ID) {
                this.onTilePaint(gameContext, tileX, tileY);
            }

            break;
        }
        case MapEditor.MODE.ENTITY: {
            this.onEntityPaint(gameContext, tileX, tileY);
            break;
        }
        default: {
            console.error("Unknown mode!");
            break;
        }
    }
}

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const { mapID, mode, actions } = this.activityStack.pop();
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
        const { id, value } = this.fill[i];

        this.targetMap.getLayer(id).fill(value);
    }
}

MapEditor.prototype.getBrushArea = function() {
    const { width, height } = this.brush;

    return `${(width + 1) * 2 - 1}x${(height + 1) * 2 - 1}`;
}

MapEditor.prototype.getModeName = function() {
    const mode = this.modes.getValue();

    switch(mode) {
        case MapEditor.MODE.TILE: return "TILE";
        case MapEditor.MODE.ENTITY: return "ENTITY";
        default: return "INVALID"
    }
}

MapEditor.prototype.getPalletName = function() {
    return this.brushSets.getValue().name;
}

MapEditor.prototype.getPalletID = function(index) {
    return this.brushSets.getValue().getTileID(index);
}

MapEditor.prototype.getPalletSize = function() {
    return this.brushSets.getValue().getSize();
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

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);
    const { width, height } = brushSize;
    
    this.brush.setSize(width, height);
}

MapEditor.prototype.scrollMode = function(delta = 0) {
    this.modes.loop(delta);
}

MapEditor.prototype.scrollBrushSet = function(delta = 0) {
    this.brushSets.loop(delta);
}

MapEditor.prototype.toggleInversion = function() {
    //Only toggle if using autotiler.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0) {
        this.flags ^= MapEditor.FLAG.INVERT_AUTOTILER;
    }

    return (this.flags & MapEditor.FLAG.INVERT_AUTOTILER) !== 0
}

MapEditor.prototype.toggleAutotiling = function() {
    this.flags ^= MapEditor.FLAG.USE_AUTOTILER;

    //If disabling autotiler, then also disable inverting.
    if((this.flags & MapEditor.FLAG.USE_AUTOTILER) === 0) {
        this.flags &= (~MapEditor.FLAG.INVERT_AUTOTILER);
    }

    return (this.flags & MapEditor.FLAG.USE_AUTOTILER) !== 0
}

MapEditor.prototype.toggleEraser = function() {
    const isErasing = this.brush.toggleEraser();

    return isErasing;
}

MapEditor.prototype.selectBrush = function(index) {
    const brushSet = this.brushSets.getValue();
    const tileID = brushSet.getTileID(index);

    this.brush.setBrush(tileID, `${tileID}`);
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
        if(this.fill[i].id === layerID) {
            return;
        }
    }

    this.fill.push({
        "id": layerID,
        "value": value
    });
}

MapEditor.prototype.registerBrushSizes = function(sizes) {
    this.brushSizes.setValues(sizes);
}

MapEditor.prototype.registerPermutation = function(originID, mutationID) {
    const permutations = this.permutations[originID];

    if(permutations === undefined) {
        this.permutations[originID] = [originID, mutationID];
    } else if(!permutations.includes(mutationID)) {
        permutations.push(mutationID);
    }
}

MapEditor.prototype.registerPermutations = function(permutations) {
    for(const { origin, variants } of permutations) {
        for(const variant of variants) {
            this.registerPermutation(origin, variant);
        }
    }
}

MapEditor.prototype.registerBrushSets = function(brushSets) {
    const sets = [];

    for(const { name, values } of brushSets) {
        const brushSet = new BrushSet(name, values);

        sets.push(brushSet);
    }

    this.brushSets.setValues(sets);
}