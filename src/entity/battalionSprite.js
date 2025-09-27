import { Graph } from "../../engine/graphics/graph.js";
import { SpriteHelper } from "../../engine/sprite/spriteHelper.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";

export const BattalionSprite = function() {
    Graph.call(this);

    this.spriteID = null;
    this.schemaID = null;
    this.schema = null;
}

BattalionSprite.prototype = Object.create(Graph.prototype);
BattalionSprite.prototype.constructor = BattalionSprite;

BattalionSprite.prototype.destroy = function() {
    this.spriteID = null;
    this.schemaID = null;

    if(this.parent) {
        this.parent.terminate();
    }
}

BattalionSprite.prototype.init = function(gameContext, spriteID, schemaID, schema) {
    if(this.parent === null) {
        const sprite = SpriteHelper.createColoredSprite(gameContext, spriteID, schemaID, schema, SpriteManager.LAYER.MIDDLE);

        this.spriteID = spriteID;
        this.schemaID = schemaID;
        this.schema = schema;

        if(sprite) {
            sprite.addChild(this);
        }
    }
}

BattalionSprite.prototype.updateSchema = function(gameContext, schemaID, schema) {
    if(schemaID !== this.schemaID) {
        this.schemaID = schemaID;
        this.schema = schema;
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

        if(this.schemaID !== null && this.schema !== null) {
            SpriteHelper.updateColoredSprite(gameContext, spriteIndex, this.spriteID, this.schemaID, this.schema);
        } else {
            spriteManager.updateSprite(spriteIndex, this.spriteID);
        }
    }
}