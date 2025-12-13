import { UIElement } from "../uiElement.js";

export const Icon = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.texture = null;
    this.scale = 1;
}

Icon.prototype = Object.create(UIElement.prototype);
Icon.prototype.constructor = Icon;

Icon.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.5;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}

Icon.prototype.onDraw = function(display, localX, localY) {
    if(this.texture) {
        const { bitmap } = this.texture;

        if(bitmap) {
            const { context } = display;

            context.drawImage(bitmap, localX, localY, bitmap.width * this.scale, bitmap.height * this.scale);
        }
    }
}

Icon.prototype.setScale = function(scale) {
    if(scale < 0.1) {
        this.scale = 0.1;
    } else {
        this.scale = 1;
    }
}

Icon.prototype.setTexture = function(texture) {
    this.texture = texture;
}