import { TextureRegistry } from "../../engine/resources/textureRegistry.js";

export const PortraitHandler = function() {
    this.registry = new TextureRegistry();
}

PortraitHandler.prototype.load = function(portaitTypes) {
    const textureMap = this.registry.createTextures(portaitTypes);
}