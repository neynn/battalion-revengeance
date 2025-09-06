import { Graph } from "../graphics/graph.js";
import { clampValue } from "../math/math.js";

export const UIElement = function(DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);

    this.anchor = UIElement.ANCHOR_TYPE.TOP_LEFT;
    this.originX = 0;
    this.originY = 0;
    this.width = 0;
    this.height = 0;
    this.collider = null;
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

UIElement.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;

    if(this.collider) {
        this.collider.setPosition(positionX, positionY);
    }
}

UIElement.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;

    if(this.collider) {
        this.collider.setSize(width, height);
    }
} 

UIElement.prototype.setOrigin = function(originX, originY) {
    this.originX = originX;
    this.originY = originY;
}

UIElement.prototype.setAnchor = function(anchor) {
    if(UIElement.ANCHOR_TYPE[anchor] !== undefined) {
        this.anchor = UIElement.ANCHOR_TYPE[anchor];
    }
}

UIElement.prototype.getCollisions = function(mouseX, mouseY, mouseRange) {
    if(!this.collider) {
        return [];
    }

    const stack = [this];
    const positions = [mouseX, mouseY];
    const collisions = [];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const isColliding = graph.collider.isColliding(positionX, positionY, mouseRange);

        if(!isColliding) {
            continue;
        }

        const nextX = positionX - graph.positionX;
        const nextY = positionY - graph.positionY;
        const children = graph.children;

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            
            if(child.collider) {
                stack.push(child);
                positions.push(nextX);
                positions.push(nextY);
            }
        }

        collisions.push(graph);
    }

    return collisions;
}

UIElement.prototype.updateAnchor = function(windowWidth, windowHeight) {    
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