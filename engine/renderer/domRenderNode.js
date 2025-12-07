export const DOMRenderNode = function() {
    this.element = document.createElement("div");
    this.element.style.position = "absolute";
    this.setPosition(0, 0);
    this.setSize(0, 0);
}

DOMRenderNode.prototype.addToDocument = function() {
    document.body.appendChild(this.element);
}

DOMRenderNode.prototype.removeChild = function(child) {
    this.element.removeChild(child);
}

DOMRenderNode.prototype.addChild = function(child) {
    this.element.appendChild(child);
}

DOMRenderNode.prototype.show = function() {
    this.element.style.visibility = "visible";
}

DOMRenderNode.prototype.hide = function() {
    this.element.style.visibility = "hidden";
}

DOMRenderNode.prototype.setSize = function(width, height) {
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
}

DOMRenderNode.prototype.setPosition = function(positionX, positionY) {
    this.element.style.top = `${positionY}px`;
    this.element.style.left = `${positionX}px`;
}

DOMRenderNode.prototype.getChildren = function() {
    return this.element.childNodes;
}