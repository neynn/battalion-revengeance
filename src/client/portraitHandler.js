import { Texture } from "../../engine/resources/texture.js";
import { TextureRegistry } from "../../engine/resources/textureRegistry.js";

export const PortraitHandler = function() {
    this.registry = new TextureRegistry();
    this.textureMap = {};
}

PortraitHandler.prototype.load = function(portaitTypes) {
    this.textureMap = this.registry.createTextures(portaitTypes);
}

PortraitHandler.prototype.exit = function() {
    this.registry.clear();
}

PortraitHandler.prototype.getPortraitTexture = function(portraitID) {
    const textureID = this.textureMap[portraitID];

    if(textureID !== undefined) {
        const texture = this.registry.getTexture(textureID);

        if(texture !== null) {
            if(texture.state === Texture.STATE.EMPTY) {
                texture.requestBitmap();
            }

            return texture;
        }
    }

    return TextureRegistry.EMPTY_TEXTURE;
}