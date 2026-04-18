import { Texture } from "../engine/resources/texture/texture.js";
import { TextureHandle } from "../engine/resources/texture/textureHandle.js";
import { DIRECTION, ENTITY_SPRITE, ENTITY_TYPE } from "./enums.js";

export const ShadeCache = function() {
   const MAX_SHADES = ENTITY_TYPE._COUNT * DIRECTION._COUNT;

    this.handles = [];

    for(let i = 0; i < MAX_SHADES; i++) {
        this.handles[i] = new TextureHandle();
    }
}

ShadeCache.prototype.getShade = function(index) {
    if(index < 0 || index >= this.handles.length) {
        return Texture.EMPTY_HANDLE;
    }

    return this.handles[index];
}

ShadeCache.prototype.exit = function() {
    for(let i = 0; i < this.handles.length; i++) {
        this.handles[i].clear();
    }
}

ShadeCache.prototype.loadShades = function(gameContext, entityTypeID) {
    const { typeRegistry, spriteManager } = gameContext;
    const { sprites } = typeRegistry.getEntityType(entityTypeID);

    for(let i = 0; i < DIRECTION._COUNT; i++) {
        const shadeHandle = this.handles[entityTypeID * DIRECTION._COUNT + i];

        if(shadeHandle.state !== TextureHandle.STATE.EMPTY) {
            continue;
        } 

        const spriteIndex = ENTITY_SPRITE.IDLE_UP + i;
        const spriteName = sprites[spriteIndex];

        if(spriteName) {
            spriteManager.createShadeTask(spriteName, shadeHandle);
        }
    }
}