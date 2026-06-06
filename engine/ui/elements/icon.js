import { Texture } from "../../resources/texture/texture.js";
import { ImageResource } from "../../resources/texture/imageResource.js";
import { UIElement } from "../uiElement.js";

export const Icon = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.image = Texture.EMPTY_IMAGE;
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
    const { state, bitmap } = this.image;

    if(state === ImageResource.STATE.LOADED) {
        const { context } = display;

        context.drawImage(bitmap, localX, localY, bitmap.width * this.scale, bitmap.height * this.scale);
    }
}

Icon.prototype.setScale = function(scale) {
    if(scale < 0.1) {
        this.scale = 0.1;
    } else {
        this.scale = 1;
    }
}

Icon.prototype.setImage = function(image) {
    this.image = image;
}