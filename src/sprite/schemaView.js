import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { SCHEMA_TYPE } from "../enums.js";

export const createSchemaViewSprite = function(gameContext, spriteID, schema, layerID) {
    const { spriteManager } = gameContext;
    const { id, colorMap } = schema;

    if(id !== SCHEMA_TYPE.RED) {
        spriteManager.createCopyTexture(spriteID, id, colorMap);
    }

    return spriteManager.createSprite(spriteID, layerID, id);
}

export const SchemaView = function(visual, spriteID) {
    this.visual = visual;
    this.spriteID = spriteID;
    this.schema = null;
    this.positionX = 0;
    this.positionY = 0;
}

SchemaView.prototype.createTexture = function(gameContext, spriteID) {
    if(!this.schema) {
        return;
    }

    const { spriteManager } = gameContext;
    const { id, colorMap } = this.schema;

    //Red is the default color. Creating a copy of it wasted memory.
    if(id !== SCHEMA_TYPE.RED) {
        spriteManager.createCopyTexture(spriteID, id, colorMap);
    }
}

SchemaView.prototype.destroy = function() {
    this.spriteID = null;
    this.schema = null;
    this.visual.terminate();
}

SchemaView.prototype.updateSchema = function(gameContext, schema) {
    if(!this.schema || this.schema !== schema) {
        this.schema = schema;
        this.createTexture(gameContext, this.spriteID);
        this.updateVisual(gameContext);
    }
}

SchemaView.prototype.updateType = function(gameContext, spriteType) {
    if(spriteType !== this.spriteID) {
        this.spriteID = spriteType;
        this.createTexture(gameContext, this.spriteID);
        this.updateVisual(gameContext);
    }
}

SchemaView.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
    this.visual.setPosition(this.positionX, this.positionY);
}

SchemaView.prototype.setPositionVec = function(position) {
    const { x, y } = position;

    this.positionX = x;
    this.positionY = y;
    this.visual.setPosition(x, y);
}

SchemaView.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
    this.visual.setPosition(this.positionX, this.positionY);
}

SchemaView.prototype.updateVisual = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteIndex = this.visual.getIndex();
    const variantID = this.schema === null ? SpriteManager.NO_VARIANT : this.schema.id;

    spriteManager.updateSprite(spriteIndex, this.spriteID, variantID);
}

SchemaView.prototype.setOpacity = function(opacity) {
    this.visual.setOpacity(opacity);
}

SchemaView.prototype.lockEnd = function() {
    this.visual.lock();
}

SchemaView.prototype.unlockEnd = function() {
    this.visual.unlock();
}

SchemaView.prototype.isVisible = function(x, y, w, h) {
    return this.visual.isVisible(x, y, w, h);
}