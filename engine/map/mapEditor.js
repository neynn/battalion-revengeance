import { EventEmitter } from "../events/eventEmitter.js";
import { Scroller } from "../util/scroller.js";
import { Brush } from "./editor/brush.js";
import { Pallet } from "./editor/pallet.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.pallet = new Pallet();
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.modes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.autotilerState = MapEditor.AUTOTILER_STATE.INACTIVE;
    this.activityStack = [];

    this.events = new EventEmitter();
    this.events.listen(MapEditor.EVENT.BRUSH_UPDATE);
    this.events.listen(MapEditor.EVENT.PALLET_UPDATE);
    this.events.listen(MapEditor.EVENT.MODE_UPDATE);
    this.events.listen(MapEditor.EVENT.SET_UPDATE);
}

MapEditor.EVENT = {
    BRUSH_UPDATE: 0,
    PALLET_UPDATE: 1,
    MODE_UPDATE: 2,
    SET_UPDATE: 3
};

MapEditor.AUTOTILER_STATE = {
    INACTIVE: 0,
    ACTIVE: 1,
    ACTIVE_INVERTED: 2
};

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW",
    [MapEditor.MODE.AUTOTILE]: "AUTOTILE"
};

MapEditor.prototype.paint = function(gameContext, mapID, layerID) {}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);

    if(brushSize !== null) {
        this.brush.size = brushSize;
        this.events.emit(MapEditor.EVENT.BRUSH_UPDATE, this.brush);
    }
}

MapEditor.prototype.scrollMode = function(delta = 0) {
    const mode = this.modes.loop(delta);

    if(mode !== null) {
        this.reloadPallet();
        this.events.emit(MapEditor.EVENT.MODE_UPDATE);
    }
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet !== null) {
        this.reloadPallet();
        this.events.emit(MapEditor.EVENT.SET_UPDATE);
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
        case MapEditor.MODE.AUTOTILE: {
            this.pallet.clear();
            break;
        }
    }

    this.events.emit(MapEditor.EVENT.PALLET_UPDATE, this.pallet);
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
    const gameMap = mapManager.getMap(mapID);

    if(!gameMap) {
        return;
    }

    for(let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { layerID, tileX, tileY, oldID } = action;

        gameMap.placeTile(oldID, layerID, tileX, tileY);
    }
}

MapEditor.prototype.toggleInversion = function() {
    switch(this.autotilerState) {
        case MapEditor.AUTOTILER_STATE.ACTIVE: {
            this.autotilerState = MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED;
            break;
        }
        case MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED: {
            this.autotilerState = MapEditor.AUTOTILER_STATE.ACTIVE;
            break;
        }
    }

    return this.autotilerState;
}

MapEditor.prototype.toggleAutotiling = function() {
    switch(this.autotilerState) {
        case MapEditor.AUTOTILER_STATE.INACTIVE: {
            this.autotilerState = MapEditor.AUTOTILER_STATE.ACTIVE;
            break;
        }
        default: {
            this.autotilerState = MapEditor.AUTOTILER_STATE.INACTIVE;
            break;
        }
    }

    return this.autotilerState;
}

MapEditor.prototype.toggleEraser = function() {
    const state = this.brush.toggleEraser();
    this.events.emit(MapEditor.EVENT.BRUSH_UPDATE, this.brush);
    return state;
}

MapEditor.prototype.resetBrush = function() {
    this.brush.reset();
    this.events.emit(MapEditor.EVENT.BRUSH_UPDATE, this.brush);
}

MapEditor.prototype.selectBrush = function(index) {
    const { id, name } = this.pallet.getElement(index);

    this.brush.setBrush(id, name);
    this.events.emit(MapEditor.EVENT.BRUSH_UPDATE, this.brush);
}

MapEditor.prototype.setBrushSizes = function(sizes) {
    this.brushSizes.setValues(sizes);
}