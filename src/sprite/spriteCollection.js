export const SpriteCollection = function() {
    this.markerSprite = null;
}

SpriteCollection.prototype.create = function(gameContext) {
    const { spriteManager } = gameContext;

    this.markerSprite = spriteManager.createSprite("marker");
}

SpriteCollection.prototype.drawMarker = function(display, markerX, markerY) {
    display.setAlpha(1);
    this.markerSprite.onDraw(display, markerX, markerY);
}