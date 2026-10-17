import { ImageResource } from "../resources/texture/imageResource.js";

export const drawTextureWithOffset = function(texture, display, screenX, screenY) {
    const { state, width, height, bitmap } = texture.getImage();

    if(state === ImageResource.STATE.LOADED) {
        const { context } = display;

        context.drawImage(
            bitmap,
            0, 0, width, height,
            screenX - width, screenY - height, width, height
        );
    }
}

export const drawTextureQuad = function(texture, quad, display, screenX, screenY) {
    const { state, bitmap } = texture.getImage();

    if(state === ImageResource.STATE.LOADED) {
        const { x, y, w, h } = quad;
        const { context } = display;

        context.drawImage(
            bitmap,
            x, y, w, h,
            screenX, screenY, w, h
        );
    } 
}

export const drawTextureRegion = function(texture, regionID, display, screenX, screenY) {
    const { state, bitmap } = texture.getImage();

    if(state === ImageResource.STATE.LOADED) {
        if(regionID >= 0 && regionID < texture.regions.length) {
            const { x, y, w, h } = texture.regions[regionID];
            const { context } = display;

            context.drawImage(
                bitmap,
                x, y, w, h,
                screenX, screenY, w, h
            );
        }
    } 
}

export const drawTexture = function(texture, display, screenX, screenY) {
    const { state, bitmap, width, height } = texture.getImage();

    if(state === ImageResource.STATE.LOADED) {
        const { context } = display;

        context.drawImage(
            bitmap,
            0, 0, width, height,
            screenX, screenY, width, height
        );
    }
}