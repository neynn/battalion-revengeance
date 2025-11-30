import { ColorHelper } from "../graphics/colorHelper.js";
import { Texture } from "./texture.js";

export const AtlasTexture = function(id, path, regions) {
    Texture.call(this, id, path);

    this.regions = regions;
}

AtlasTexture.prototype = Object.create(Texture.prototype);
AtlasTexture.prototype.constructor = AtlasTexture;

AtlasTexture.prototype.loadColoredRegions = function(copyBitmap, schema) {
    if(this.state === Texture.STATE.EMPTY) {
        this.state = Texture.STATE.LOADING;

        const bitmapData = ColorHelper.createBitmapData(copyBitmap);
        const mappedData = ColorHelper.mapBitmapPartial(bitmapData, schema, this.regions);

        createImageBitmap(mappedData)
        .then(bitmap => this.setBitmapData(bitmap))
        .catch(error => this.clear());
    }
}

AtlasTexture.prototype.autoCalcRegions = function(startX, startY, frameWidth, frameHeight, rows, columns) {
    this.regions = {};
    let id = 1;

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < columns; j++) {
            this.regions[id++] = {
                "x": startX + j * frameWidth,
                "y": startY + i * frameHeight,
                "w": frameWidth,
                "h": frameHeight
            }
        }
    }
}

AtlasTexture.prototype.getFramesAuto = function(autoRegions) {
    const { start = 1, jump = 0, repeat = 0 } = autoRegions;
    const frames = [];

    for(let i = 0; i < repeat; i++) {
        const regionID = start + jump * i;
        const region = this.regions[regionID];

        if(region) {
            frames.push(region);
        } else {
            //TODO: Log region error.
        }
    }

    return frames;
}

AtlasTexture.prototype.getFrames = function(regions) {
    const frames = [];

    for(let i = 0; i < regions.length; i++) {
        const regionID = regions[i];
        const region = this.regions[regionID];

        if(region) {
            frames.push(region);
        } else {
            //TODO: Log region error.
        }
    }

    return frames;
}