import { TileManager } from "../../tile/tileManager.js";

export const Brush = function() {
    this.id = TileManager.TILE_ID.INVALID;
    this.name = "";
    this.previousID = TileManager.TILE_ID.INVALID;
    this.previousName = "";
    this.width = 0;
    this.height = 0;
}

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
            break;
        }
    }
}

Brush.prototype.recordPrevious = function() {
    this.previousID = this.id;
    this.previousName = this.name;
}

Brush.prototype.applyPrevious = function() {
    this.id = this.previousID;
    this.name = this.previousName;
}

Brush.prototype.toggleEraser = function() {
    if(this.id === TileManager.TILE_ID.EMPTY) {
        this.applyPrevious();
    } else {
        this.recordPrevious();
        this.enableEraser();
    }
}

Brush.prototype.enableEraser = function() {
    this.name = "ERASER";
    this.id = TileManager.TILE_ID.EMPTY;
}

Brush.prototype.reset = function() {
    this.name = "";
    this.id = TileManager.TILE_ID.INVALID;
}