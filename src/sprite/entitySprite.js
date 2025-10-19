import { Renderer } from "../../engine/renderer/renderer.js";
import { PLAYER_PREFERENCE } from "../playerPreference.js";
import { SchemaSprite } from "./schemaSprite.js";

export const EntitySprite = function(visual, spriteID, schemaID, schema) {
    SchemaSprite.call(this, visual, spriteID, schemaID, schema);

    this.healthFactor = 1;
    this.isFrozen = false;
    //this.freeze();
}

EntitySprite.BLOCK = {
    COUNT: 4,
    WIDTH: 4,
    HEIGHT: 8,
    GAP: 1
};

EntitySprite.HEALTH_THRESHOLDS = [
    { "above": 0.75, "color": "#00ff00" },
    { "above": 0.5, "color": "#ffff00"},
    { "above": 0.25, "color": "#ff8800"},
    { "above": 0, "color": "#ff0000" }
];

EntitySprite.DEFAULT_HEALTH_COLOR = "#ffffff";

EntitySprite.BACKGROUND_COLOR = "#000000";

EntitySprite.HEALTH = {
    PERCENT_GOOD: 0.66,
    PERCENT_WARN: 0.33,
    WIDTH: (EntitySprite.BLOCK.GAP * (EntitySprite.BLOCK.COUNT + 1)) + EntitySprite.BLOCK.WIDTH * EntitySprite.BLOCK.COUNT,
    HEIGHT: EntitySprite.BLOCK.GAP * 2 + EntitySprite.BLOCK.HEIGHT,
};

EntitySprite.HEALTH_OFFSET = {
    //-5 is the offset of the marker texture.
    X: 56 - 5 - EntitySprite.HEALTH.WIDTH,
    Y: 56 - 5 - EntitySprite.HEALTH.HEIGHT,
};

EntitySprite.prototype = Object.create(SchemaSprite.prototype);
EntitySprite.prototype.constructor = EntitySprite;

EntitySprite.prototype.onHealthUpdate = function(currentHealth, maxHealth) {
    this.healthFactor = (currentHealth / maxHealth);

    if(this.healthFactor > 1) {
        this.healthFactor = 1;
    }
}

EntitySprite.prototype.drawHealth = function(display, viewportLeftEdge, viewportTopEdge) {
    const { context } = display;
    const healthX = this.positionX - viewportLeftEdge + EntitySprite.HEALTH_OFFSET.X;
    const healthY = this.positionY - viewportTopEdge + EntitySprite.HEALTH_OFFSET.Y;

    context.fillStyle = EntitySprite.BACKGROUND_COLOR;
    context.fillRect(healthX, healthY, EntitySprite.HEALTH.WIDTH, EntitySprite.HEALTH.HEIGHT);

    let colorFound = false;

    for(let i = 0; i < EntitySprite.HEALTH_THRESHOLDS.length; i++) {
        const { above, color } = EntitySprite.HEALTH_THRESHOLDS[i];

        if(this.healthFactor >= above) {
            context.fillStyle = color;
            colorFound = true;
            break;
        }
    }

    if(!colorFound) {
        context.fillStyle = EntitySprite.DEFAULT_HEALTH_COLOR;
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

EntitySprite.prototype.drawCloaked = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    const opacity = this.visual.getOpacity();

    if(opacity < 0.5) {
        this.visual.setOpacity(0.5);
        this.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        this.visual.setOpacity(opacity);
    } else {
        this.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }
}

EntitySprite.prototype.drawNormal = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    this.visual.update(realTime, deltaTime);
    this.visual.draw(display, viewportLeftEdge, viewportTopEdge);

    if(PLAYER_PREFERENCE.FORCE_HEALTH_DRAW) {
        this.drawHealth(display, viewportLeftEdge, viewportTopEdge)
    } else if(this.healthFactor > 0 && this.healthFactor < 1) {
        this.drawHealth(display, viewportLeftEdge, viewportTopEdge);
    }
    
    if(Renderer.DEBUG.SPRITES) {
        this.visual.debug(display, viewportLeftEdge, viewportTopEdge);
    }
}

EntitySprite.prototype.freeze = function() {
    this.visual.setFrame(0);
    this.visual.freeze();
    this.isFrozen = true;
}

EntitySprite.prototype.thaw = function() {
    this.visual.thaw();
    this.isFrozen = false;
}

EntitySprite.prototype.pause = function() {
    this.visual.setFrame(0);
    this.visual.lock();
}

EntitySprite.prototype.resume = function() {
    this.visual.unlock();
}