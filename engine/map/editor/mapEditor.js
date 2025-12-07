import { getRandomElement } from "../../math/math.js";
import { Scroller } from "../../util/scroller.js";
import { Brush } from "./brush.js";
import { BrushSet } from "./brushSet.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.brushSets = new Scroller(new BrushSet("INVALID", []));
    this.brushSizes = new Scroller({ "width": 0, "height": 0 });
    this.modes = new Scroller(MapEditor.MODE.DRAW);
    this.activityStack = [];
    this.permutations = {};
    this.flags = MapEditor.FLAG.NONE | MapEditor.FLAG.USE_PERMUTATION;
    this.modes.setValues([MapEditor.MODE.DRAW]);
}

MapEditor.FLAG = {
    NONE: 0,
    USE_PERMUTATION: 1 << 0,
    USE_AUTOTILER: 1 << 1,
    INVERT_AUTOTILER: 1 << 2
};

MapEditor.MODE = {
    DRAW: 0
};

MapEditor.prototype.onPaint = function(gameContext, worldMap, position, layerID) {}

MapEditor.prototype.getBrushArea = function() {
    const { width, height } = this.brush;

    return `${(width + 1) * 2 - 1}x${(height + 1) * 2 - 1}`;
}

MapEditor.prototype.getModeName = function() {
    const mode = this.modes.getValue();

    switch(mode) {
        case MapEditor.MODE.DRAW: return "DRAW";
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

MapEditor.prototype.getBrushID = function() {
    if((this.flags & MapEditor.FLAG.USE_PERMUTATION)) {
        return this.getPermutation(this.brush.id);
    }

    return this.brush.id;
}

MapEditor.prototype.registerPermutation = function(originID, mutationID) {
    const permutations = this.permutations[originID];

    if(permutations === undefined) {
        this.permutations[originID] = [originID, mutationID];
    } else if(!permutations.includes(mutationID)) {
        permutations.push(mutationID);
    }
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

MapEditor.prototype.loadBrushSets = function(brushSets) {
    const sets = [];

    for(const { name, values } of brushSets) {
        const brushSet = new BrushSet(name, values);

        sets.push(brushSet);
    }

    this.brushSets.setValues(sets);
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

MapEditor.prototype.resetBrush = function() {
    this.brush.reset();
}

MapEditor.prototype.selectBrush = function(index) {
    const brushSet = this.brushSets.getValue();
    const tileID = brushSet.getTileID(index);

    this.brush.setBrush(tileID, `${tileID}`);
}

MapEditor.prototype.loadBrushSizes = function(sizes) {
    this.brushSizes.setValues(sizes);
}

MapEditor.prototype.loadPermutations = function(permutations) {
    for(const { origin, variants } of permutations) {
        for(const variant of variants) {
            this.registerPermutation(origin, variant);
        }
    }
}