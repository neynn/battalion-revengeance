import { TileManager } from "../../tile/tileManager.js";

export const Brush = function() {
    this.id = TileManager.TILE_ID.INVALID;
    this.name = "";
    this.mode = Brush.MODE.NONE;
    this.previousID = TileManager.TILE_ID.INVALID;
    this.previousName = "";
    this.previousMode = Brush.MODE.NONE;
    this.width = 0;
    this.height = 0;
}

Brush.MODE = {
    NONE: 0,
    ERASE: 1,
    DRAW: 2
};

Brush.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

Brush.prototype.setBrush = function(id, name) {
    switch(id) {
        case TileManager.TILE_ID.INVALID: {
            this.reset();
            break;
        }
        case TileManager.TILE_ID.EMPTY: {
            this.enableEraser();
            break;
        }
        default: {
            this.id = id;
            this.name = name;
            this.mode = Brush.MODE.DRAW;
            break;
        }
    }
}

Brush.prototype.recordPrevious = function() {
    this.previousID = this.id;
    this.previousName = this.name;
    this.previousMode = this.mode;
}

Brush.prototype.applyPrevious = function() {
    this.id = this.previousID;
    this.name = this.previousName;
    this.mode = this.previousMode;
}

Brush.prototype.toggleEraser = function() {
    if(this.mode === Brush.MODE.ERASE) {
        this.applyPrevious();
    } else {
        this.recordPrevious();
        this.enableEraser();
    }

    return this.mode === Brush.MODE.ERASE;
}

Brush.prototype.enableEraser = function() {
    this.name = "ERASER";
    this.id = TileManager.TILE_ID.EMPTY;
    this.mode = Brush.MODE.ERASE;
}

Brush.prototype.reset = function() {
    this.name = "";
    this.id = TileManager.TILE_ID.INVALID;
    this.mode = Brush.MODE.NONE;
}

Brush.prototype.paint = function(tileX, tileY, onPaint) {
    if(this.mode !== Brush.MODE.NONE && typeof onPaint === "function") {
        const startX = tileX - this.width;
        const startY = tileY - this.height;
        const endX = tileX + this.width;
        const endY = tileY + this.height;

        for(let i = startY; i <= endY; i++) {
            for(let j = startX; j <= endX; j++) {
                onPaint(j, i);
            }
        }
    }
}