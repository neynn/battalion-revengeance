export const ContextNode = function(element) {
    this.element = element;
}

ContextNode.prototype.onUpdate = function(context) {}

ContextNode.prototype.show = function() {
    this.element.style.visibility = "visible";
}

ContextNode.prototype.hide = function() {
    this.element.style.visibility = "hidden";
}

ContextNode.prototype.setPosition = function(positionX, positionY) {
    this.element.style.top = `${positionY}px`;
    this.element.style.left = `${positionX}px`;
}