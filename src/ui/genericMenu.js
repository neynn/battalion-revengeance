export const GenericMenu = function(id) {
    this.element = document.getElementById(id);
}

GenericMenu.prototype.hide = function() {
    this.element.style.display = "none";
}

GenericMenu.prototype.show = function() {
    this.element.style.display = "block";
}

GenericMenu.prototype.init = function(gameContext) {}
GenericMenu.prototype.exit = function(gameContext) {}