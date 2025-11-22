import { Pallet } from "./pallet.js";

export const Brush = function() {
    this.id = Pallet.ID.ERROR;
    this.name = "";
    this.mode = Brush.MODE.NONE;
    this.previousID = Pallet.ID.ERROR;
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
        case Pallet.ID.ERROR: {
            this.reset();
            break;
        }
        case Pallet.ID.ERASER: {
            this.enableEraser();
            break;
        }
        default: {
            this.id = id;
            this.name = name;
            this.mode = Brush.MODE.DRAW;
        }
    }
}

Brush.prototype.getAreaString = function() {
    return `${(this.width + 1) * 2 - 1}x${(this.height + 1) * 2 - 1}`;
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

    return this.mode;
}

Brush.prototype.enableEraser = function() {
    this.name = "ERASER";
    this.id = Pallet.ID.ERASER;
    this.mode = Brush.MODE.ERASE;
}

Brush.prototype.reset = function() {
    this.name = "";
    this.id = Pallet.ID.ERROR;
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
                onPaint(j, i, this.id, this.name);
            }
        }
    }
}