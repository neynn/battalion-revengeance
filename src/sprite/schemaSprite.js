import { Renderer } from "../../engine/renderer.js";
import { SpriteHelper } from "../../engine/sprite/spriteHelper.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const SchemaSprite = function(visual, spriteID, schemaID, schema) {
    this.visual = visual;
    this.spriteID = spriteID;
    this.schemaID = schemaID;
    this.schema = schema;
}

SchemaSprite.createVisual = function(gameContext, spriteID, schemaID, schema, layerID) {
    if(schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
        return SpriteHelper.createSpriteWithAlias(gameContext, spriteID, schemaID, layerID);
    } else {
        return SpriteHelper.createColoredSprite(gameContext, spriteID, schemaID, schema, layerID);
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
    this.visual.updatePosition(deltaX, deltaY);
}

SchemaSprite.prototype.setPosition = function(positionX, positionY) {
    this.visual.setPosition(positionX, positionY);
}

SchemaSprite.prototype.updateVisual = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteIndex = this.visual.getIndex();

    if(this.schemaID === null) {
        spriteManager.updateSprite(spriteIndex, this.spriteID);
    } else if(this.schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
        SpriteHelper.updateSpriteWithAlias(gameContext, spriteIndex, this.spriteID, this.schemaID);
    } else {
        SpriteHelper.updateColoredSprite(gameContext, spriteIndex, this.spriteID, this.schemaID, this.schema);
    }
}

SchemaSprite.prototype.setOpacity = function(opacity) {
    this.visual.setOpacity(opacity);
}

SchemaSprite.prototype.lockEnd = function() {
    this.visual.lockLoop();
}

SchemaSprite.prototype.unlockEnd = function() {
    this.visual.freeLoop();
}

SchemaSprite.prototype.isVisible = function(x, y, w, h) {
    return this.visual.isVisible(x, y, w, h);
}

SchemaSprite.prototype.hasLoopedOnce = function() {
    return this.visual.hasFinishedOnce();
}

SchemaSprite.prototype.getOpacity = function() {
    return this.visual.getOpacity();
}

SchemaSprite.prototype.draw = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    this.visual.update(realTime, deltaTime);
    this.visual.draw(display, viewportLeftEdge, viewportTopEdge);

    if(Renderer.DEBUG.SPRITES) {
        this.visual.debug(display, viewportLeftEdge, viewportTopEdge);
    }
}