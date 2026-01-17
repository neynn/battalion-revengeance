export const GenericMenu = function(id) {
    this.element = document.getElementById(id);
    this.buttons = [];
}

GenericMenu.prototype.hide = function() {
    this.element.style.display = "none";
}

GenericMenu.prototype.show = function() {
    this.element.style.display = "block";
}

GenericMenu.prototype.attachTo = function(domNode) {
    domNode.addChild(this.element);
}

GenericMenu.prototype.addButton = function(button) {
    this.element.appendChild(button.element);
}