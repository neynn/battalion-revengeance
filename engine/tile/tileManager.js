import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { TileCategory } from "./category.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const TileManager = function() {
    this.categories = [];
    this.autotilers = [];

    this.tileCount = 0;
    this.tileTable = [];
    this.autotilerTable = [];

    this.visualCount = 1;
    this.visualTable = [0];
    this.visuals = [TileManager.EMPTY_VISUAL];
    this.activeVisuals = [];
    this.visualTableMap = new Map();
}

TileManager.EMPTY_VISUAL = new TileVisual(0);

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
        this.tileTable[i] = -1;
        this.autotilerTable[i] = -1;
    }

    this.tileCount = count;
}

TileManager.prototype.createCategories = function(count) {
    for(let i = 0; i < count; i++) {
        this.categories[i] = new TileCategory();
    }
}

TileManager.prototype.createAutotilers = function(count) {
    for(let i = 0; i < count; i++) {
        this.autotilers[i] = new Autotiler(TileManager.TILE_ID.EMPTY);
    }
}

TileManager.prototype.registerTile = function(tileID, typeID, autotilerID, categoryID) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return;
    }

    this.tileTable[tileID] = typeID;
    this.autotilerTable[tileID] = autotilerID;

    if(categoryID >= 0 && categoryID < this.categories.length) {
        this.categories[categoryID].addMember(i);
    }
}

TileManager.prototype.registerTiles = function(beginID, endID, typeID, autotilerID, categoryID) {
    if(beginID > endID || beginID < 0 || endID >= this.tileCount) {
        return;
    }

    for(let i = beginID; i <= endID; i++) {
        this.tileTable[i] = typeID;
        this.autotilerTable[i] = autotilerID;

        if(categoryID >= 0 && categoryID < this.categories.length) {
            this.categories[categoryID].addMember(i);
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

TileManager.prototype.setLogicalID = function(tileID, logicalID) {
    if(tileID < 0 || tileID >= this.tileCount) {
        return;
    }

    this.tileTable[tileID] = logicalID;
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
            const { handle } = textureObject;

            if(textureConfig) {
                visual.generate(textureObject, textureConfig, regionID);
            }

            if(visual.frameCount > 0) {
                visual.setHandle(handle);
                handle.addReference();

                textureLoader.loadTexture(textureID);
            }
        }

        this.visuals.push(visual);
    }
}

TileManager.prototype.loadAutotiler = function(autotilerID, typeID, categories) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return;
    }

    const autotiler = this.autotilers[autotilerID];

    autotiler.setType(typeID);

    for(const categoryID of categories) {
        if(categoryID >= 0 && categoryID < this.categories.length) {
            autotiler.addCategory(this.categories[categoryID]);
        }
    }
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

TileManager.prototype.disableVisual = function(mapID) {
    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === mapID) {
            this.activeVisuals[i].reset();
            this.activeVisuals[i] = this.activeVisuals[this.activeVisuals.length - 1];
            this.activeVisuals.pop();
            break;
        }
    }
}

TileManager.prototype.enableVisual = function(mapID) {
    const index = mapID - 1;

    if(index < 0 || index >= this.visuals.length) {
        return;
    }

    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === mapID) {
            return;
        }
    }

    this.activeVisuals.push(this.visuals[index]);
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

TileManager.prototype.getLogicalID = function(mapID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return -1;
    }

    return this.tileTable[mapID];
}

TileManager.prototype.getVisual = function(mapID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return TileManager.EMPTY_VISUAL;
    }

    return this.visuals[this.visualTable[mapID]];
}

TileManager.prototype.getAutotiler = function(autotilerID) {
    if(autotilerID < 0 || autotilerID >= this.autotilers.length) {
        return null;
    }

    return this.autotilers[autotilerID];
}

TileManager.prototype.getAutotilerByVisual = function(mapID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return null;
    }

    return this.getAutotiler(this.autotilerTable[mapID]);
}