import { ContextNode } from "../../engine/camera/contextNode.js";

export const DialogueBox = function() {
    ContextNode.call(this, document.getElementById("DialogueBox"));
}

DialogueBox.prototype = Object.create(ContextNode.prototype);
DialogueBox.prototype.constructor = DialogueBox;

DialogueBox.prototype.anchor = function(context) {
    const positionX = context.getLeftEdge();
    const positionY = context.getBottomEdgeOfCamera() - 200;
    
    this.setPosition(positionX, positionY);
}

DialogueBox.prototype.onAdd = function(context) {
    this.anchor(context);
}

DialogueBox.prototype.onPositionUpdate = function(context) {
    this.anchor(context);
}