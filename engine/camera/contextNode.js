export const ContextNode = function(element) {
    this.element = element;
}

ContextNode.prototype.onPositionUpdate = function(context) {}
ContextNode.prototype.onAdd = function(context) {}

ContextNode.prototype.show = function() {
    this.element.style.visibility = "visible";
}

ContextNode.prototype.hide = function() {
    this.element.style.visibility = "hidden";
}

ContextNode.prototype.toTopLeft = function(context) {
    const positionX = context.getLeftEdge();
    const positionY = context.getTopEdge();
    
    this.setPosition(positionX, positionY);
}

ContextNode.prototype.setPosition = function(positionX, positionY) {
    this.element.style.top = `${positionY}px`;
    this.element.style.left = `${positionX}px`;
}