import { Renderer } from "../../engine/renderer/renderer.js";
import { SchemaSprite } from "./schemaSprite.js";

export const EntitySprite = function(visual, spriteID, schemaID, schema) {
    SchemaSprite.call(this, visual, spriteID, schemaID, schema);

    this.healthFactor = 1;
}

EntitySprite.BLOCK = {
    COUNT: 4,
    WIDTH: 4,
    HEIGHT: 8,
    GAP: 1
};

EntitySprite.HEALTH_COLOR = {
    BACKGROUND: "#000000",
    GOOD: "#00ff00",
    WARN: "#ffff00",
    LOW: "#ff0000",
};

EntitySprite.HEALTH = {
    PERCENT_GOOD: 0.66,
    PERCENT_WARN: 0.33,
    WIDTH: (EntitySprite.BLOCK.GAP * (EntitySprite.BLOCK.COUNT + 1)) + EntitySprite.BLOCK.WIDTH * EntitySprite.BLOCK.COUNT,
    HEIGHT: EntitySprite.BLOCK.GAP * 2 + EntitySprite.BLOCK.HEIGHT,
};

EntitySprite.prototype = Object.create(SchemaSprite.prototype);
EntitySprite.prototype.constructor = EntitySprite;

EntitySprite.prototype.onHealthUpdate = function(currentHealth, maxHealth) {
    this.healthFactor = (currentHealth / maxHealth);

    if(this.healthFactor > 1) {
        this.healthFactor = 1;
    }

    this.healthFactor = 0.60;
}

EntitySprite.prototype.drawHealth = function(display, viewportLeftEdge, viewportTopEdge) {
    const { context } = display;
    const healthX = this.positionX - viewportLeftEdge + 56 - EntitySprite.HEALTH.WIDTH;
    const healthY = this.positionY - viewportTopEdge + 56 - EntitySprite.HEALTH.HEIGHT;

    context.fillStyle = EntitySprite.HEALTH_COLOR.BACKGROUND;
    context.fillRect(healthX, healthY, EntitySprite.HEALTH.WIDTH, EntitySprite.HEALTH.HEIGHT);

    if(this.healthFactor > EntitySprite.HEALTH.PERCENT_GOOD) {
        context.fillStyle = EntitySprite.HEALTH_COLOR.GOOD;
    } else if(this.healthFactor > EntitySprite.HEALTH.PERCENT_WARN) {
        context.fillStyle = EntitySprite.HEALTH_COLOR.WARN;
    } else {
        context.fillStyle = EntitySprite.HEALTH_COLOR.LOW;
    }

    let blockX = healthX + EntitySprite.HEALTH.WIDTH;
    let blockY = healthY + EntitySprite.BLOCK.GAP;
    let pixelFill = (EntitySprite.BLOCK.HEIGHT * EntitySprite.BLOCK.COUNT) * this.healthFactor;

    while(pixelFill > 0) {
        blockX -= (EntitySprite.BLOCK.WIDTH + EntitySprite.BLOCK.GAP);
        pixelFill -= EntitySprite.BLOCK.HEIGHT;

        if(pixelFill >= 0) {
            context.fillRect(blockX, blockY, EntitySprite.BLOCK.WIDTH, EntitySprite.BLOCK.HEIGHT);
        } else {
            context.fillRect(blockX, blockY - pixelFill, EntitySprite.BLOCK.WIDTH, pixelFill + EntitySprite.BLOCK.HEIGHT);
        }
    }
}

EntitySprite.prototype.draw = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    this.visual.update(realTime, deltaTime);
    this.visual.draw(display, viewportLeftEdge, viewportTopEdge);

    if(this.healthFactor < 1) {
        this.drawHealth(display, viewportLeftEdge, viewportTopEdge);
    }
    
    if(Renderer.DEBUG.SPRITES) {
        this.visual.debug(display, viewportLeftEdge, viewportTopEdge);
    }
}