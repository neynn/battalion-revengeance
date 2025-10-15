export const RenderRoot = function() {
    this.element = document.createElement("div");
    this.element.style.position = "absolute";
    this.setPosition(0, 0);
    this.setSize(0, 0);
}

RenderRoot.prototype.addToDocument = function() {
    document.body.appendChild(this.element);
}

RenderRoot.prototype.removeChild = function(child) {
    this.element.removeChild(child);
}

RenderRoot.prototype.addChild = function(child) {
    this.element.appendChild(child);
}

RenderRoot.prototype.show = function() {
    this.element.style.visibility = "visible";
}

RenderRoot.prototype.hide = function() {
    this.element.style.visibility = "hidden";
}

RenderRoot.prototype.setSize = function(width, height) {
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
}

RenderRoot.prototype.setPosition = function(positionX, positionY) {
    this.element.style.top = `${positionY}px`;
    this.element.style.left = `${positionX}px`;
}

RenderRoot.prototype.getChildren = function() {
    return this.element.childNodes;
}