import { EventEmitter } from "../../events/eventEmitter.js";
import { getRandomElement } from "../../math/math.js";
import { Scroller } from "../../util/scroller.js";
import { Brush } from "./brush.js";
import { Pallet } from "./pallet.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.pallet = new Pallet();
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.modes = new Scroller([MapEditor.MODE.DRAW]);
    this.activityStack = [];
    this.permutations = {};
    this.flags = MapEditor.FLAG.NONE;

    this.events = new EventEmitter();
    this.events.register(MapEditor.EVENT.BRUSH_UPDATE);
    this.events.register(MapEditor.EVENT.PALLET_UPDATE);
    this.events.register(MapEditor.EVENT.MODE_UPDATE);
    this.events.register(MapEditor.EVENT.SET_UPDATE);
}

MapEditor.FLAG = {
    NONE: 0,
    USE_PERMUTATION: 1 << 0,
    USE_AUTOTILER: 1 << 1,
    INVERT_AUTOTILER: 1 << 2
};

MapEditor.EVENT = {
    BRUSH_UPDATE: "BRUSH_UPDATE",
    PALLET_UPDATE: "PALLET_UPDATE",
    MODE_UPDATE: "MODE_UPDATE",
    SET_UPDATE: "SET_UPDATE"
};

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW"
};

MapEditor.prototype.onPaint = function(gameContext, worldMap, position, layerID) {}

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
        this.permutations.push(mutationID);
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

    if(brushSize !== null) {
        const { width, height } = brushSize;
        
        this.brush.setSize(width, height);
        this.tellBrushUpdate();
    }
}

MapEditor.prototype.scrollMode = function(delta = 0) {
    const mode = this.modes.loop(delta);

    if(mode !== null) {
        this.reloadPallet();
        this.events.emit(MapEditor.EVENT.MODE_UPDATE, {
            "mode": mode
        });
    }
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet !== null) {
        this.reloadPallet();
        this.events.emit(MapEditor.EVENT.SET_UPDATE, {
            "set": brushSet
        });
    }
}

MapEditor.prototype.reloadPallet = function() {
    const brushMode = this.modes.getValue();

    switch(brushMode) {
        case MapEditor.MODE.DRAW: {
            const pallet = this.brushSets.getValue();

            if(pallet) {
                const { values } = pallet;
        
                this.pallet.load(values);
            } else {
                this.pallet.clear();
            }
            break;
        }
    }

    this.events.emit(MapEditor.EVENT.PALLET_UPDATE, {
        "pallet": this.pallet
    });

    this.resetBrush();
}

MapEditor.prototype.initBrushSets = function(brushSets, hiddenSets) {
    const sets = [];

    for(const setID in brushSets) {
        let isHidden = false;

        for(let i = 0; i < hiddenSets.length; i++) {
            if(setID === hiddenSets[i]) {
                isHidden = true;
                break;
            }
        }

        if(isHidden) {
            continue;
        }

        const brushSet = {};
        const set = brushSets[setID];

        for(const tileID in set) {
            brushSet[tileID] = set[tileID];
        }

        sets.push({
            "id": setID,
            "values": brushSet
        });
    }

    this.brushSets.setValues(sets);
    this.reloadPallet();
}

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const { mapID, mode, actions } = this.activityStack.pop();
    const worldMap = mapManager.getMap(mapID);

    if(!worldMap) {
        return;
    }

    for(let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { layerID, tileX, tileY, oldID } = action;

        worldMap.placeTile(oldID, layerID, tileX, tileY);
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
    const state = this.brush.toggleEraser();

    this.tellBrushUpdate();

    return state;
}

MapEditor.prototype.resetBrush = function() {
    this.brush.reset();
    this.tellBrushUpdate();
}

MapEditor.prototype.selectBrush = function(index) {
    const { id, name } = this.pallet.getElement(index);

    this.brush.setBrush(id, name);
    this.tellBrushUpdate();
}

MapEditor.prototype.setBrushSizes = function(sizes) {
    this.brushSizes.setValues(sizes);
}

MapEditor.prototype.tellBrushUpdate = function() {
    this.events.emit(MapEditor.EVENT.BRUSH_UPDATE, {
        "brush": this.brush
    });
}