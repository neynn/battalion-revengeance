import { Graph } from "../../engine/graphics/graph.js";
import { SpriteHelper } from "../../engine/sprite/spriteHelper.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";

export const BattalionSprite = function() {
    Graph.call(this);

    this.spriteID = null;
    this.schemaID = null;
}

BattalionSprite.SCHEMA = {
    "BLUE": {
        0x661A5E: [61, 49, 127],
        0xAA162C: [43, 95, 199],
        0xE9332E: [69, 164, 225],
        0xFF9085: [169, 207, 255]
    },
    "GREEN": {
        0x661A5E: [30, 91, 35],
        0xAA162C: [95, 147, 95],
        0xE9332E: [143, 222, 101],
        0xFF9085: [241, 246, 95]
    },
    "YELLOW": {
        0x661A5E: [134, 114, 52],
        0xAA162C: [217, 164, 73],
        0xE9332E: [242, 225, 104],
        0xFF9085: [255, 255, 160]
    },
    "DARK_RED": {
        0x661A5E: [42, 33, 52],
        0xAA162C: [78, 12, 35],
        0xE9332E: [138, 26, 17],
        0xFF9085: [220, 86, 86]
    },
    "DARK_BLUE": {
        0x661A5E: [30, 28, 59],
        0xAA162C: [22, 39, 117],
        0xE9332E: [65, 68, 147],
        0xFF9085: [99, 112, 173]
    },
    "BRONZE": {
        0x661A5E: [50, 42, 50],
        0xAA162C: [95, 69, 104],
        0xE9332E: [150, 125, 41],
        0xFF9085: [216, 147, 69]
    },
    "DARK_GREEN": {
        0x661A5E: [53, 61, 25],
        0xAA162C: [65, 91, 13],
        0xE9332E: [130, 156, 39],
        0xFF9085: [203, 212, 68]
    },
    "GOLD": {
        0x661A5E: [95, 56, 65],
        0xAA162C: [199, 65, 52],
        0xE9332E: [255, 182, 14],
        0xFF9085: [255, 255, 69]
    },
    "CYAN": {
        0x661A5E: [95, 86, 151],
        0xAA162C: [69, 147, 99],
        0xE9332E: [151, 216, 238],
        0xFF9085: [255, 255, 203]
    },
    "PINK": {
        0x661A5E: [114, 36, 82],
        0xAA162C: [196, 84, 129],
        0xE9332E: [255, 143, 182],
        0xFF9085: [255, 215, 220]
    },
    "WHITE": {
        0x661A5E: [106, 103, 141],
        0xAA162C: [179, 193, 220],
        0xE9332E: [229, 232, 255],
        0xFF9085: [245, 245, 255]
    },
    "PURPLE": {
        0x661A5E: [39, 43, 49],
        0xAA162C: [86, 69, 160],
        0xE9332E: [147, 130, 225],
        0xFF9085: [203, 194, 255]
    },
    "BLACK": {
        0x661A5E: [28, 29, 39],
        0xAA162C: [40, 44, 50],
        0xE9332E: [66, 65, 68],
        0xFF9085: [71, 75, 136]
    },
    "GRAY": {
        0x661A5E: [43, 49, 52],
        0xAA162C: [66, 67, 91],
        0xE9332E: [155, 151, 151],
        0xFF9085: [200, 190, 163]
    },
    "CREAM": {
        0x661A5E: [105, 125, 108],
        0xAA162C: [197, 171, 159],
        0xE9332E: [232, 223, 192],
        0xFF9085: [255, 255, 255]
    },
    "LIME": {
        0x661A5E: [92, 107, 42],
        0xAA162C: [49, 166, 26],
        0xE9332E: [55, 225, 54],
        0xFF9085: [121, 255, 128]
    }
};

BattalionSprite.prototype = Object.create(Graph.prototype);
BattalionSprite.prototype.constructor = BattalionSprite;

BattalionSprite.prototype.destroy = function() {
    this.spriteID = null;
    this.schemaID = null;

    if(this.parent) {
        this.parent.terminate();
    }
}

BattalionSprite.prototype.create = function(gameContext, spriteID, schemaID) {
    if(this.parent === null) {
        const sprite = SpriteHelper.createColoredSprite(gameContext, spriteID, schemaID, BattalionSprite.SCHEMA, SpriteManager.LAYER.MIDDLE);

        this.spriteID = spriteID;
        this.schemaID = schemaID;

        if(sprite) {
            sprite.addChild(this);
        }
    }
}

BattalionSprite.prototype.updateSchema = function(gameContext, schemaID) {
    if(schemaID !== this.schemaID) {
        this.schemaID = schemaID;
        this.updateParent(gameContext);
    }
}

BattalionSprite.prototype.updateType = function(gameContext, spriteType) {
    if(spriteType !== this.spriteID) {
        this.spriteID = spriteType;
        this.updateParent(gameContext);
    }
}

BattalionSprite.prototype.setPosition = function(positionX, positionY) {
    if(this.parent) {
        this.parent.setPosition(positionX, positionY);
    }
}

BattalionSprite.prototype.updateParent = function(gameContext) {
    if(this.parent) {
        const { spriteManager } = gameContext;
        const spriteIndex = this.parent.getIndex();

        if(this.schemaID !== null) {
            SpriteHelper.updateColoredSprite(gameContext, spriteIndex, this.spriteID, this.schemaID, BattalionSprite.SCHEMA);
        } else {
            spriteManager.updateSprite(spriteIndex, this.spriteID);
        }
    }
}