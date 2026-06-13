import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const TileManager = function() {
    this.autotilers = [];

    this.tileCount = 0;
    this.typeTable = [];
    this.autotilerTable = [];
    this.categoryTable = [];

    this.visualCount = 1;
    this.visualTable = [0];
    this.visuals = [new TileVisual(0)];
    this.activeVisuals = [];
    this.visualTableMap = new Map();
}

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    for(let i = 0; i < this.activeVisuals.length; i++) {
        this.activeVisuals[i].update(realTime);
    }
}

TileManager.prototype.initTables = function(count) {
    for(let i = 0; i < count; i++) {
        this.visualTable[i] = 0;
        this.categoryTable[i] = 0;
        this.typeTable[i] = 0;
        this.autotilerTable[i] = -1;
    }

    this.tileCount = count;
}

TileManager.prototype.registerTile = function(tileID, typeID, autotilerID, categoryFlags = 0) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return;
    }

    this.typeTable[tileID] = typeID;
    this.autotilerTable[tileID] = autotilerID;
    this.categoryTable[tileID] = categoryFlags;
}

TileManager.prototype.registerTiles = function(beginID, endID, typeID, autotilerID, categoryFlags = 0) {
    if(beginID > endID || beginID < 0 || endID >= this.tileCount) {
        return;
    }

    for(let i = beginID; i <= endID; i++) {
        this.typeTable[i] = typeID;
        this.autotilerTable[i] = autotilerID;
        this.categoryTable[i] = categoryFlags;
    }
}

TileManager.prototype.setLogicalID = function(tileID, logicalID) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return;
    }

    this.typeTable[tileID] = logicalID;
}

TileManager.prototype.createAutotilers = function(count) {
    for(let i = 0; i < count; i++) {
        this.autotilers[i] = new Autotiler(i, TileManager.TILE_ID.EMPTY, this.categoryTable);
    }
}

TileManager.prototype.loadAutotiler = function(autotilerID, typeID, categoryFlags) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    autotiler.setType(typeID);
    autotiler.setFlags(categoryFlags);
}

TileManager.prototype.loadAutotilerValues = function(autotilerID, values) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    for(const indexID in values) {
        const index = Number(indexID);
        const tileID = values[indexID];

        if(tileID < this.tileCount) {
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

        if(nextID < this.tileCount) {
            autotiler.setValue(i, nextID);
        } else {
            console.error("Value is too large!");
        }  
    }
}

TileManager.prototype.registerVisual = function(tileID, texture, sprite) {
    if(tileID < 1 || tileID >= this.tileCount) {
        return;
    }

    const visualName = texture + "::" + sprite;
    const currentIndex = this.visualTableMap.get(visualName);

    if(currentIndex === undefined) {
        const visualID = this.visualCount++;

        this.visualTable[tileID] = visualID;
        this.visualTableMap.set(visualName, visualID);
    } else {
        this.visualTable[tileID] = currentIndex;
    }
}

TileManager.prototype.registerVisuals = function(tileID, texture, visuals) {
    if(tileID < 1 || (tileID + visuals.length - 1) >= this.tileCount) {
        return;
    }

    for(let i = 0; i < visuals.length; i++) {
        const mapID = tileID + i;
        const visualName = visuals[i];

        this.registerVisual(mapID, texture, visualName);
    }
}

TileManager.prototype.registerVisualsAuto = function(tileID, texture, prefix, count) {
    if(tileID < 1 || (tileID + count - 1) >= this.tileCount) {
        return;
    }

    for(let i = 0; i < count; i++) {
        const mapID = tileID + i;
        const spriteName = prefix + i;

        this.registerVisual(mapID, texture, spriteName);
    }
}

TileManager.prototype.createVisuals = function(textureLoader, tileAtlases) {
    textureLoader.createTileTextures(tileAtlases);

    for(const [visualID, index] of this.visualTableMap) {
        const [texture, regionID] = visualID.split("::");
        const visual = new TileVisual(index);
        const textureConfig = tileAtlases[texture];
        const textureID = textureLoader.getTileID(texture);

        if(textureID !== TextureRegistry.INVALID_ID) {
            const textureObject = textureLoader.getTexture(textureID);
            const image = textureObject.getImage();

            if(textureConfig) {
                visual.generate(textureObject, textureConfig, regionID);
            }

            if(visual.frameCount > 0) {
                visual.setImage(image);
                image.addReference();

                textureLoader.loadTexture(textureID);
            }
        }

        this.visuals.push(visual);
    }
}

TileManager.prototype.disableVisual = function(tileID) {
    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === tileID) {
            this.activeVisuals[i].reset();
            this.activeVisuals[i] = this.activeVisuals[this.activeVisuals.length - 1];
            this.activeVisuals.pop();
            break;
        }
    }
}

TileManager.prototype.enableVisual = function(tileID) {
    if(tileID < 1 || tileID >= this.tileCount) {
        return;
    }

    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === tileID) {
            return;
        }
    }

    const visual = this.visuals[this.visualTable[tileID]];

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

TileManager.prototype.getLogicalID = function(tileID) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return 0;
    }

    return this.typeTable[tileID];
}

TileManager.prototype.isVisualValid = function(tileID) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return false;
    }

    if(tileID === 0) {
        return true;
    }

    return this.visualTable[tileID] !== 0;
}

TileManager.prototype.getVisual = function(tileID) {
    if(tileID < 0 || tileID >= this.tileCount) {
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
    if(tileID < 0 || tileID >= this.tileCount) {
        return null;
    }

    return this.getAutotiler(this.autotilerTable[tileID]);
}