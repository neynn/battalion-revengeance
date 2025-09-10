import { Graph } from "../../engine/graphics/graph"

export const BattalionSprite = function() {
    Graph.call(this);
}

BattalionSprite.prototype = Object.create(Graph.prototype);
BattalionSprite.prototype.constructor = BattalionSprite;