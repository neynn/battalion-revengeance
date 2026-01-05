import { Renderer } from "../../engine/renderer/renderer.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants.js";
import { PLAYER_PREFERENCE } from "../enums.js";
import { SchemaView } from "./schemaView.js";

const BLOCK = { COUNT: 4, WIDTH: 4, HEIGHT: 8, GAP: 1 };
const WIDTH = (BLOCK.GAP * (BLOCK.COUNT + 1)) + BLOCK.WIDTH * BLOCK.COUNT;
const HEIGHT = BLOCK.GAP * 2 + BLOCK.HEIGHT;
const OFFSET_X = TILE_WIDTH - 5 - WIDTH;
const OFFSET_Y = TILE_HEIGHT - 5 - HEIGHT;
const BACKGROUND_COLOR = "#000000";
const DEFAULT_HEALTH_COLOR = "#ffffff";
const HEALTH_THRESHOLDS = [
    { "above": 0.75, "color": "#00ff00" },
    { "above": 0.5, "color": "#ffff00"},
    { "above": 0.25, "color": "#ff8800"},
    { "above": 0, "color": "#ff0000" }
];

export const EntityView = function(visual, spriteID, schemaID, schema) {
    SchemaView.call(this, visual, spriteID, schemaID, schema);

    this.healthFactor = 1;
    this.isFrozen = false;
    this.healthColor = DEFAULT_HEALTH_COLOR;
}

EntityView.prototype = Object.create(SchemaView.prototype);
EntityView.prototype.constructor = EntityView;

EntityView.prototype.onHealthUpdate = function(currentHealth, maxHealth) {
    this.healthFactor = (currentHealth / maxHealth);

    if(this.healthFactor > 1) {
        this.healthFactor = 1;
    }

    let colorFound = false;

    for(let i = 0; i < HEALTH_THRESHOLDS.length; i++) {
        const { above, color } = HEALTH_THRESHOLDS[i];

        if(this.healthFactor >= above) {
            this.healthColor = color;
            colorFound = true;
            break;
        }
    }

    if(!colorFound) {
        this.healthColor = DEFAULT_HEALTH_COLOR;
    }
}

EntityView.prototype.drawHealth = function(display, viewportLeftEdge, viewportTopEdge) {
    const { context } = display;
    const healthX = this.positionX - viewportLeftEdge + OFFSET_X;
    const healthY = this.positionY - viewportTopEdge + OFFSET_Y;

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(healthX, healthY, WIDTH, HEIGHT);
    context.fillStyle = this.healthColor;

    let blockX = healthX + WIDTH;
    let blockY = healthY + BLOCK.GAP;
    let pixelFill = (BLOCK.HEIGHT * BLOCK.COUNT) * this.healthFactor;

    while(pixelFill > 0) {
        blockX -= (BLOCK.WIDTH + BLOCK.GAP);
        pixelFill -= BLOCK.HEIGHT;

        if(pixelFill >= 0) {
            context.fillRect(blockX, blockY, BLOCK.WIDTH, BLOCK.HEIGHT);
        } else {
            context.fillRect(blockX, blockY - pixelFill, BLOCK.WIDTH, pixelFill + BLOCK.HEIGHT);
        }
    }
}

EntityView.prototype.drawCloaked = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    const opacity = this.visual.getOpacity();

    if(opacity < 0.5) {
        this.visual.setOpacity(0.5);
        this.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        this.visual.setOpacity(opacity);
    } else {
        this.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }
}

EntityView.prototype.drawNormal = function(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
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

EntityView.prototype.freeze = function() {
    this.visual.setFrame(0);
    this.visual.freeze();
    this.isFrozen = true;
}

EntityView.prototype.thaw = function() {
    this.visual.thaw();
    this.isFrozen = false;
}

EntityView.prototype.pause = function() {
    this.visual.setFrame(0);
    this.visual.lock();
}

EntityView.prototype.resume = function() {
    this.visual.unlock();
}