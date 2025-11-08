import { Renderer } from "../../engine/renderer/renderer.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const SchemaSprite = function(visual, spriteID, schemaID, schema) {
    this.visual = visual;
    this.spriteID = spriteID;
    this.schemaID = schemaID;
    this.schema = schema;
    this.positionX = 0;
    this.positionY = 0;
}

SchemaSprite.createVisual = function(gameContext, spriteID, schemaID, schema, layerID) {
    const { spriteManager } = gameContext;

    if(schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
        return spriteManager.createSpriteWithAlias(spriteID, schemaID, layerID);
    } else {
        return spriteManager.createColoredSprite(spriteID, schemaID, schema, layerID);
    }
}

SchemaSprite.prototype.preload = function(gameContext, spriteID) {
    const { spriteManager } = gameContext;

    if(this.schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
        spriteManager.createSpriteAlias(spriteID, this.schemaID);
    } else {
        spriteManager.createCopyTexture(spriteID, this.schemaID, this.schema);
    }
}

SchemaSprite.prototype.destroy = function() {
    this.spriteID = null;
    this.schemaID = null;
    this.schema = null;
    this.visual.terminate();
}

SchemaSprite.prototype.updateSchema = function(gameContext, schemaID, schema) {
    if(schemaID !== this.schemaID) {
        this.schemaID = schemaID;
        this.schema = schema;
        this.updateVisual(gameContext);
    }
}

SchemaSprite.prototype.updateType = function(gameContext, spriteType) {
    if(spriteType !== this.spriteID) {
        this.spriteID = spriteType;
        this.updateVisual(gameContext);
    }
}

SchemaSprite.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
    this.visual.setPosition(this.positionX, this.positionY);
}

SchemaSprite.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
    this.visual.setPosition(this.positionX, this.positionY);
}

SchemaSprite.prototype.updateVisual = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteIndex = this.visual.getIndex();

    if(this.schemaID === null) {
        spriteManager.updateSprite(spriteIndex, this.spriteID);
    } else if(this.schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
        spriteManager.updateSpriteWithAlias(spriteIndex, this.spriteID, this.schemaID);
    } else {
        spriteManager.updateColoredSprite(spriteIndex, this.spriteID, this.schemaID, this.schema);
    }
}

SchemaSprite.prototype.setOpacity = function(opacity) {
    this.visual.setOpacity(opacity);
}

SchemaSprite.prototype.lockEnd = function() {
    this.visual.lock();
}

SchemaSprite.prototype.unlockEnd = function() {
    this.visual.unlock();
}

SchemaSprite.prototype.isVisible = function(x, y, w, h) {
    return this.visual.isVisible(x, y, w, h);
}

SchemaSprite.prototype.draw = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    this.visual.update(realTime, deltaTime);
    this.visual.draw(display, viewportLeftEdge, viewportTopEdge);

    if(Renderer.DEBUG.SPRITES) {
        this.visual.debug(display, viewportLeftEdge, viewportTopEdge);
    }
}