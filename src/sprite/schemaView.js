import { Renderer } from "../../engine/renderer/renderer.js";
import { SCHEMA_TYPE } from "../enums.js";

export const createSchemaViewSprite = function(gameContext, spriteID, schemaID, schema, layerID) {
    const { spriteManager } = gameContext;

    if(schemaID === SCHEMA_TYPE.RED) {
        return spriteManager.createSpriteWithAlias(spriteID, schemaID, layerID);
    } else {
        return spriteManager.createColoredSprite(spriteID, schemaID, schema, layerID);
    }
}

export const SchemaView = function(visual, spriteID, schemaID, schema) {
    this.visual = visual;
    this.spriteID = spriteID;
    this.schemaID = schemaID;
    this.schema = schema;
    this.positionX = 0;
    this.positionY = 0;
}

SchemaView.prototype.preload = function(gameContext, spriteID) {
    const { spriteManager } = gameContext;

    if(this.schemaID === SCHEMA_TYPE.RED) {
        spriteManager.createSpriteAlias(spriteID, this.schemaID);
    } else {
        spriteManager.createCopyTexture(spriteID, this.schemaID, this.schema);
    }
}

SchemaView.prototype.destroy = function() {
    this.spriteID = null;
    this.schemaID = null;
    this.schema = null;
    this.visual.terminate();
}

SchemaView.prototype.updateSchema = function(gameContext, schemaID, schema) {
    if(schemaID !== this.schemaID) {
        this.schemaID = schemaID;
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

    if(this.schemaID === null) {
        spriteManager.updateSprite(spriteIndex, this.spriteID);
    } else if(this.schemaID === SCHEMA_TYPE.RED) {
        spriteManager.updateSpriteWithAlias(spriteIndex, this.spriteID, this.schemaID);
    } else {
        spriteManager.updateColoredSprite(spriteIndex, this.spriteID, this.schemaID, this.schema);
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

SchemaView.prototype.draw = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    this.visual.update(realTime, deltaTime);
    this.visual.draw(display, viewportLeftEdge, viewportTopEdge);
}