import { Graph } from "../graphics/graph.js";
import { clampValue } from "../math/math.js";

export const UIElement = function(DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);

    this.anchor = UIElement.ANCHOR_TYPE.TOP_LEFT;
    this.originX = 0;
    this.originY = 0;
}

UIElement.ANCHOR_TYPE = {
    TOP_CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_CENTER: 3,
    BOTTOM_LEFT: 4,
    BOTTOM_RIGHT: 5,
    CENTER: 6,
    LEFT: 7,
    RIGHT: 8,
    PERCENT: 9
};

UIElement.prototype = Object.create(Graph.prototype);
UIElement.prototype.constructor = UIElement;

UIElement.prototype.setText = function(text) {}

UIElement.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

UIElement.prototype.setAnchor = function(anchor) {
    if(UIElement.ANCHOR_TYPE[anchor] !== undefined) {
        this.anchor = UIElement.ANCHOR_TYPE[anchor];
    }
}

UIElement.prototype.onWindowResize = function(windowWidth, windowHeight) {
    switch(this.anchor) {
        case UIElement.ANCHOR_TYPE.TOP_CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.TOP_LEFT: {
            this.setPosition(this.originX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.TOP_RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;

            this.setPosition(anchorX, this.originY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_LEFT: {
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.BOTTOM_RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;
            const anchorY = windowHeight - this.height - this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.LEFT: {
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(this.originX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.CENTER: {
            const anchorX = windowWidth / 2 - this.width / 2 + this.originX;
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.RIGHT: {
            const anchorX = windowWidth - this.width - this.originX;
            const anchorY = windowHeight / 2 - this.height / 2 + this.originY;

            this.setPosition(anchorX, anchorY);
            break;
        }
        case UIElement.ANCHOR_TYPE.PERCENT: {
            const percentX = clampValue(this.originX, 100, 0);
            const percentY = clampValue(this.originY, 100, 0);

            const shiftX = Math.floor((percentX / 100) * windowWidth - this.width / 2);
            const shiftY = Math.floor((percentY / 100) * windowHeight - this.height / 2);

            const anchorX = clampValue(shiftX, windowWidth - this.width, 0);
            const anchorY = clampValue(shiftY, windowHeight - this.height, 0);

            this.setPosition(anchorX, anchorY);
            break;
        }
    }
}