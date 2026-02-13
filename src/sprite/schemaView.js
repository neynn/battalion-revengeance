import { SCHEMA_TYPE } from "../enums.js";

export const createSchemaViewSprite = function(gameContext, spriteID, schema, layerID) {
    const { spriteManager } = gameContext;
    const { id, colorMap } = schema;

    if(schema.id === SCHEMA_TYPE.RED) {
        return spriteManager.createSpriteWithAlias(spriteID, id, layerID);
    } else {
        return spriteManager.createColoredSprite(spriteID, id, colorMap, layerID);  
    }
}

export const SchemaView = function(visual, spriteID) {
    this.visual = visual;
    this.spriteID = spriteID;
    this.schema = null;
    this.positionX = 0;
    this.positionY = 0;
}

SchemaView.prototype.preload = function(gameContext, spriteID) {
    if(!this.schema) {
        return;
    }

    const { spriteManager } = gameContext;
    const { id, colorMap } = this.schema;

    if(id === SCHEMA_TYPE.RED) {
        spriteManager.createSpriteAlias(spriteID, id);
    } else {
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
        this.updateVisual(gameContext);
    }
}

SchemaView.prototype.updateType = function(gameContext, spriteType) {
    if(spriteType !== this.spriteID) {
        this.spriteID = spriteType;
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

    if(this.schema === null) {
        spriteManager.updateSprite(spriteIndex, this.spriteID);
    } else if(this.schema.id === SCHEMA_TYPE.RED) {
        spriteManager.updateSpriteWithAlias(spriteIndex, this.spriteID, this.schema.id);
    } else {
        spriteManager.updateColoredSprite(spriteIndex, this.spriteID, this.schema.id, this.schema.colorMap);
    }
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