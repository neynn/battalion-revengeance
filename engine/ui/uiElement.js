import { Graph } from "../graphics/graph.js";
import { ANCHOR_TABLE_X, ANCHOR_TABLE_Y, ANCHOR_TYPE } from "./constants.js";

export const UIElement = function(DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);

    this.effect = UIElement.EFFECT.NONE;
    this.anchor = ANCHOR_TYPE.TOP_LEFT;
    this.originX = 0;
    this.originY = 0;
}

UIElement.EFFECT = {
    NONE: 0,
    FADE_IN: 1,
    FADE_OUT: 2
};

UIElement.prototype = Object.create(Graph.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

UIElement.prototype.setAnchor = function(anchor) {
    if(anchor < 0 || anchor >= ANCHOR_TYPE._COUNT) {
        this.anchor = ANCHOR_TYPE.TOP_LEFT;
    } else {
        this.anchor = anchor;
    }
}

UIElement.prototype.onWindowResize = function(windowWidth, windowHeight) {
    const anchorX = (windowWidth - this.width) * ANCHOR_TABLE_X[this.anchor];
    const anchorY = (windowHeight - this.height) * ANCHOR_TABLE_Y[this.anchor];
    const positionX = anchorX + this.originX;
    const positionY = anchorY + this.originY;

    this.setPosition(positionX, positionY);
}

UIElement.prototype.setEffect = function(effectID) {
    this.effect = effectID;
}

UIElement.prototype.updateEffect = function(timestamp, deltaTime) {
    switch(this.effect) {
        case UIElement.EFFECT.FADE_IN: {
            const nextOpacity = this.opacity + (0.3 * deltaTime);

            if(nextOpacity >= 1) {
                this.opacity = 1;
                this.effect = UIElement.EFFECT.NONE;
            } else {
                this.opacity = nextOpacity;
            }

            break;
        }
        case UIElement.EFFECT.FADE_OUT: {
            const nextOpacity = this.opacity - (0.3 * deltaTime);

            if(nextOpacity <= 0) {
                this.opacity = 0;
                this.effect = UIElement.EFFECT.NONE;
            } else {
                this.opacity = nextOpacity;
            }

            break;
        }
    }
}

UIElement.prototype.onUpdate = function(timestamp, deltaTime) {
    this.updateEffect(timestamp, deltaTime);
}