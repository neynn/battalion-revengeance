import { Graph } from "../../engine/graphics/graph.js";
import { SpriteHelper } from "../../engine/sprite/spriteHelper.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const SchemaSprite = function() {
    Graph.call(this);

    this.spriteID = null;
    this.schemaID = null;
    this.schema = null;
}

SchemaSprite.prototype = Object.create(Graph.prototype);
SchemaSprite.prototype.constructor = SchemaSprite;

SchemaSprite.prototype.destroy = function() {
    this.spriteID = null;
    this.schemaID = null;

    if(this.parent) {
        this.parent.terminate();
    }
}

SchemaSprite.prototype.init = function(gameContext, spriteID, schemaID, schema, layerID) {
    if(this.parent === null) {
        let sprite = null;

        if(schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
            sprite = SpriteHelper.createSpriteWithAlias(gameContext, spriteID, schemaID, layerID);
        } else {
            sprite = SpriteHelper.createColoredSprite(gameContext, spriteID, schemaID, schema, layerID);
        }

        this.spriteID = spriteID;
        this.schemaID = schemaID;
        this.schema = schema;

        if(sprite) {
            sprite.addChild(this);
        }
    }
}

SchemaSprite.prototype.updateSchema = function(gameContext, schemaID, schema) {
    if(schemaID !== this.schemaID) {
        this.schemaID = schemaID;
        this.schema = schema;
        this.updateParent(gameContext);
    }
}

SchemaSprite.prototype.updateType = function(gameContext, spriteType) {
    if(spriteType !== this.spriteID) {
        this.spriteID = spriteType;
        this.updateParent(gameContext);
    }
}

SchemaSprite.prototype.updatePosition = function(deltaX, deltaY) {
    if(this.parent) {
        this.parent.updatePosition(deltaX, deltaY);
    }
}

SchemaSprite.prototype.setPosition = function(positionX, positionY) {
    if(this.parent) {
        this.parent.setPosition(positionX, positionY);
    }
}

SchemaSprite.prototype.updateParent = function(gameContext) {
    if(this.parent) {
        const { spriteManager } = gameContext;
        const spriteIndex = this.parent.getIndex();

        if(this.schemaID === null) {
            spriteManager.updateSprite(spriteIndex, this.spriteID);
        } else if(this.schemaID === TypeRegistry.SCHEMA_TYPE.RED) {
            SpriteHelper.updateSpriteWithAlias(gameContext, spriteIndex, this.spriteID, this.schemaID);
        } else {
            SpriteHelper.updateColoredSprite(gameContext, spriteIndex, this.spriteID, this.schemaID, this.schema);
        }
    }
}