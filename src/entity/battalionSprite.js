import { Graph } from "../../engine/graphics/graph.js";

export const BattalionSprite = function() {
    Graph.call(this);
}

BattalionSprite.prototype = Object.create(Graph.prototype);
BattalionSprite.prototype.constructor = BattalionSprite;

BattalionSprite.prototype.setPosition = function(positionX, positionY) {
    if(this.parent) {
        this.parent.setPosition(positionX, positionY);
    }
}

BattalionSprite.prototype.updateParent = function(gameContext, spriteType) {
    if(this.parent) {
        const { spriteManager } = gameContext;
        const spriteIndex = this.parent.getIndex();

        spriteManager.updateSprite(spriteIndex, spriteType);
    }
}