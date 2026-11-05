import { TileAnimation } from "./tileAnimation.js";
import { Autotiler } from "./autotiler.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";
import { MAX_TILES } from "../engine_constants.js";

const VISUAL_IDENTIFIER = "::";

export const TileManager = function() {
    this.typeTable = new Uint16Array(MAX_TILES);
    this.tagTable = new Uint16Array(MAX_TILES);
    this.visualTable = new Uint16Array(MAX_TILES);
    this.autotilerTable = new Int16Array(MAX_TILES);
    
    this.visualCount = 1;
    this.visuals = [new TileAnimation(0)];
    this.activeVisuals = [];
    this.animationMap = new Map();

    this.autotilerCount = 0;
    this.autotilers = [];
    this.autotilerTable.fill(-1);

}

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.realTime;

    for(let i = 0; i < this.activeVisuals.length; i++) {
        this.activeVisuals[i].update(realTime);
    }
}

TileManager.prototype.registerAutotilerGroup = function(beginID, endID, autotilerID) {
    if(beginID > endID || beginID < 0 || endID >= MAX_TILES) {
        return;
    }

    for(let i = beginID; i <= endID; i++) {
        this.autotilerTable[i] = autotilerID;
    }
}

TileManager.prototype.registerTile = function(tileID, typeID, tags = 0) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return;
    }

    this.typeTable[tileID] = typeID;
    this.tagTable[tileID] = tags;
}

TileManager.prototype.registerTileGroup = function(beginID, endID, typeID, tags = 0) {
    if(beginID > endID || beginID < 0 || endID >= MAX_TILES) {
        return;
    }

    for(let i = beginID; i <= endID; i++) {
        this.typeTable[i] = typeID;
        this.tagTable[i] = tags;
    }
}

TileManager.prototype.createAutotilers = function(count) {
    for(let i = 0; i < count; i++) {
        this.autotilers[i] = new Autotiler(i, TileManager.TILE_ID.EMPTY);
    }

    this.autotilerCount = count;
}

TileManager.prototype.loadAutotiler = function(autotilerID, typeID, tags) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    autotiler.setType(typeID);
    autotiler.setTags(tags);
}

TileManager.prototype.loadAutotilerValues = function(autotilerID, values) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    for(const indexID in values) {
        const index = Number(indexID);
        const tileID = values[indexID];

        if(tileID < MAX_TILES) {
            autotiler.setValue(index, tileID);
        } else {
            console.error("Value is too large!");
        }
    }
}

TileManager.prototype.loadAutotilerValuesAuto = function(autotilerID, tileID) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    for(let i = 0; i < autotiler.values.length; i++) {
        const nextID = tileID + i;

        if(nextID < MAX_TILES) {
            autotiler.setValue(i, nextID);
        } else {
            console.error("Value is too large!");
        }  
    }
}

TileManager.prototype.getAnimationID = function(texture, name) {
    const visualName = texture + VISUAL_IDENTIFIER + name;
    const visualID = this.animationMap.get(visualName);

    if(visualID === undefined) {
        return 0;
    }

    return visualID;
}

TileManager.prototype.registerVisual = function(tileID, texture, sprite) {
    if(tileID < 1 || tileID >= MAX_TILES) {
        return;
    }

    const visualID = this.getAnimationID(texture, sprite);

    this.visualTable[tileID] = visualID;
}

TileManager.prototype.registerVisuals = function(tileID, texture, visuals) {
    if(tileID < 1 || (tileID + visuals.length - 1) >= MAX_TILES) {
        return;
    }

    for(let i = 0; i < visuals.length; i++) {
        const mapID = tileID + i;
        const visualName = visuals[i];

        this.registerVisual(mapID, texture, visualName);
    }
}

TileManager.prototype.registerVisualsAuto = function(tileID, texture, prefix, count) {
    if(tileID < 1 || (tileID + count - 1) >= MAX_TILES) {
        return;
    }

    for(let i = 0; i < count; i++) {
        const mapID = tileID + i;
        const spriteName = prefix + i;

        this.registerVisual(mapID, texture, spriteName);
    }
}

TileManager.prototype.createTileAnimation = function(name) {
    const animationID = this.visualCount++;
    const animation = new TileAnimation(animationID);

    this.visuals[animationID] = animation;
    this.animationMap.set(name, animationID);

    return animation;
}

/**
 * 
 * @param {TextureRegistry} textureRegistry 
 * @param {object} tileDefinitions 
 */
TileManager.prototype.createTileAnimations = function(textureRegistry, tileDefinitions) {
    for(const groupID in tileDefinitions) {
        const group = tileDefinitions[groupID];
        const { texture, frameTime = 1, fromGrid = [], fromPatterns = [], patterns = {}, animations = {}, ignore = false } = group;

        if(ignore) {
            continue;
        }

        const textureID = textureRegistry.getTextureID(texture);

        if(textureID === TextureRegistry.INVALID_ID) {
            continue;
        }

        textureRegistry.loadTexture(textureID);

        const textureObject = textureRegistry.getTexture(textureID);
        const textureImage = textureObject.getImage();
    
        if(fromGrid.length !== 0) {
            if(fromGrid.length === 1 && fromGrid[0] === "*") {
                for(const [regionName, regionID] of textureObject.regionMap) {
                    const region = textureObject.regions[regionID];
                    const tileAnimation = this.createTileAnimation(groupID + VISUAL_IDENTIFIER + regionName);

                    tileAnimation.pushFrame(region);
                    tileAnimation.setImage(textureImage);
                }
            } else {
                for(const regionName of fromGrid) {
                    const region = textureObject.getRegionByName(regionName);

                    if(region) {
                        const tileAnimation = this.createTileAnimation(groupID + VISUAL_IDENTIFIER + regionName);

                        tileAnimation.pushFrame(region);
                        tileAnimation.setImage(textureImage);
                    }
                }
            }
        }

        for(const patternName of fromPatterns) {
            const pattern = patterns[patternName];

            if(pattern) {
                const tileAnimation = this.createTileAnimation(groupID + VISUAL_IDENTIFIER + patternName);

                tileAnimation.pushPattern(textureObject, pattern);
                tileAnimation.setImage(textureImage);
            }
        }

        for(const animationID in animations) {
            const { frameTime = TileAnimation.DEFAULT.FRAME_TIME, frames = [] } = animations[animationID];
            const tileAnimation = this.createTileAnimation(groupID + VISUAL_IDENTIFIER + animationID);

            tileAnimation.pushAnimation(textureObject, frames, patterns);
            tileAnimation.setFrameTime(frameTime);
            tileAnimation.setImage(textureImage);
        }
    }
}

TileManager.prototype.disableVisual = function(visualID) {
    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === visualID) {
            this.activeVisuals[i].reset();
            this.activeVisuals[i] = this.activeVisuals[this.activeVisuals.length - 1];
            this.activeVisuals.pop();
            break;
        }
    }
}

TileManager.prototype.enableVisual = function(tileID) {
    if(tileID < 1 || tileID >= MAX_TILES) {
        return;
    }

    const visual = this.visuals[this.visualTable[tileID]];

    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === visual.id) {
            return;
        }
    }

    if(visual.frameCount > 1) {
        this.activeVisuals.push(visual);
    }
}

TileManager.prototype.enableAllVisuals = function() {
    this.activeVisuals.length = 0;

    for(let i = 0; i < this.visuals.length; i++) {
        if(this.visuals[i].frameCount > 1) {
            this.activeVisuals.push(this.visuals[i]);
        }
    }
}

TileManager.prototype.disableAllVisuals = function() {
    for(let i = 0; i < this.activeVisuals.length; i++) {
        this.activeVisuals[i].reset();
    }

    this.activeVisuals.length = 0;
}

TileManager.prototype.getVisualByID = function(visualID) {
    if(visualID < 0 || visualID >= this.visuals.length) {
        return this.visuals[0];
    }

    return this.visuals[visualID];
}

TileManager.prototype.getLogicalID = function(tileID) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return 0;
    }

    return this.typeTable[tileID];
}

TileManager.prototype.getTags = function(tileID) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return 0;
    }

    return this.tagTable[tileID];
}

TileManager.prototype.hasVisual = function(tileID) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return false;
    }

    if(tileID === 0) {
        return true;
    }

    return this.visualTable[tileID] !== 0;
}

TileManager.prototype.getVisual = function(tileID) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return this.visuals[0];
    }

    return this.visuals[this.visualTable[tileID]];
}

TileManager.prototype.getAutotiler = function(autotilerID) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return null;
    }

    return this.autotilers[autotilerID];
}

TileManager.prototype.getAutotilerFromTile = function(tileID) {
    if(tileID < 0 || tileID >= MAX_TILES) {
        return null;
    }

    return this.getAutotiler(this.autotilerTable[tileID]);
}