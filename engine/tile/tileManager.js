import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { Tile, TileCategory } from "./tile.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const TileManager = function() {
    this.categories = new Map();
    this.autotilers = new Map();
    this.tileCount = 1;
    this.tileTable = [0];
    this.visualTable = [0];
    this.tiles = [TileManager.EMPTY_TILE];
    this.visuals = [TileManager.EMPTY_VISUAL];
    this.activeVisuals = [];

    this.logicTableMap = new Map();
    this.visualTableMap = new Map();
    this.regionMap = new Map();
}

TileManager.EMPTY_VISUAL = new TileVisual(0);
TileManager.EMPTY_TILE = new Tile(0, -1, null);

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

TileManager.prototype.createCategories = function(tileCategories) {
    for(const categoryID in tileCategories) {
        const category = new TileCategory(categoryID);

        this.categories.set(categoryID, category)
    }
}

TileManager.prototype.overrideTile = function(mapID, logicalID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return;
    }

    const logicIndex = this.logicTableMap.get(logicalID);

    if(logicIndex === undefined) {
        return;
    }

    this.tileTable[mapID] = logicIndex;
}

TileManager.prototype.createCustomTile = function(mapID, typeID) {
    const oldTile = this.getTile(mapID);
    const tileID = this.tiles.length;
    const tileObject = new Tile(tileID, typeID, oldTile.autotiler);
    const index = mapID - 1;

    if(index >= 0 && index < this.tileTable.length) {
        this.tileTable[index] = tileID;
    }

    this.tiles.push(tileObject);

    return tileObject;
}

TileManager.prototype.createTiles = function(logicTiles, resolveType) {
    for(const logicID in logicTiles) {
        const { tileType = null, autotiler = null } = logicTiles[logicID];
        const tileID = this.tiles.length;
        const tile = new Tile(tileID, resolveType(tileType), autotiler);

        this.tiles.push(tile);
        this.logicTableMap.set(logicID, tileID);
    }
}

TileManager.prototype.linkTables = function(tileMeta) {
    let visualIndex = 1;
    let mapID = 1;

    for(let i = 0; i < tileMeta.length; i++) {
        const { id = null, texture, category = null, logic = null, visuals = [], autoVisuals = {} } = tileMeta[i];
        const { count = 0, prefix = "" } = autoVisuals;
        const visualCount = count + visuals.length;
        let tileID = 0;
        let offset = 0;

        if(this.logicTableMap.has(logic)) {
            tileID = this.logicTableMap.get(logic);
        }
        
        for(let i = 0; i < visualCount; i++) {
            this.tileTable[mapID + i] = tileID;
            this.visualTable[mapID + i] = 0;
        }

        const categoryType = this.categories.get(category);

        if(categoryType) {
            for(let j = 0; j < visualCount; j++) {
                categoryType.addMember(mapID + j);
            }
        }

        if(id !== null && !this.regionMap.has(id)) {
            this.regionMap.set(id, mapID);
        }

        for(let j = 0; j < count; j++) {
            const visualName = texture + "::" + prefix + j;
            const currentIndex = this.visualTableMap.get(visualName);

            if(currentIndex === undefined) {
                this.visualTable[mapID + offset] = visualIndex;
                this.visualTableMap.set(visualName, visualIndex);

                visualIndex++;
            } else {
                this.visualTable[mapID + offset] = currentIndex;
            }

            offset++;
        }

        for(const name of visuals) {
            const visualName = texture + "::" + name;
            const currentIndex = this.visualTableMap.get(visualName);

            if(currentIndex === undefined) {
                this.visualTable[mapID + offset] = visualIndex;
                this.visualTableMap.set(visualName, visualIndex);

                visualIndex++;
            } else {
                this.visualTable[mapID + offset] = currentIndex;
            }

            offset++;
        }

        mapID += visualCount;
    }

    this.tileCount = mapID;
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

TileManager.prototype.createAutotilers = function(autotilers) {
    for(const autotilerID in autotilers) {
        const autotiler = this.createAutotiler(autotilers[autotilerID]);

        this.autotilers.set(autotilerID, autotiler);
    }
}

TileManager.prototype.createAutotiler = function(config) {
    const { type = Autotiler.TYPE.NONE, values = {}, categories = [], useAutoValues = null } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(const categoryID of categories) {
        const category = this.categories.get(categoryID);

        if(category) {
            autotiler.addCategory(category);
        }
    }

    if(useAutoValues !== null && this.regionMap.has(useAutoValues)) {
        const regionBegin = this.regionMap.get(useAutoValues);

        for(let i = 0; i < autotiler.values.length; i++) {
            const mapID = regionBegin + i;

            if(mapID < this.tileCount) {
                autotiler.setValue(i, mapID);
            } else {
                console.error("Value is too large!");
            }  
        }
    }

    for(const indexID in values) {
        const index = Number(indexID);
        const name = values[indexID];

        //null can be used to remove a specific value.
        if(name !== null) {
            const [regionID, value] = name.split("::");

            if(this.regionMap.has(regionID)) {
                const regionBegin = this.regionMap.get(regionID);
                const mapID = regionBegin + Number(value);

                if(mapID < this.tileCount) {
                    autotiler.setValue(index, mapID);
                } else {
                    console.error("Value is too large!");
                }
            }
        } else {
            autotiler.setValue(index, 0);
        }
    }

    return autotiler;
}

TileManager.prototype.load = function(categories, logicTiles, visualTiles, autotilers, resolveType) {
    if(!categories || !logicTiles || !visualTiles || !autotilers) {
        return;
    }

    this.createCategories(categories);
    this.createTiles(logicTiles, resolveType);
    this.linkTables(visualTiles);
    this.createAutotilers(autotilers);
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

TileManager.prototype.getTile = function(mapID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return TileManager.EMPTY_TILE;
    }

    return this.tiles[this.tileTable[mapID]];
}

TileManager.prototype.getVisual = function(mapID) {
    if(mapID < 0 || mapID >= this.tileCount) {
        return TileManager.EMPTY_VISUAL;
    }

    return this.visuals[this.visualTable[mapID]];
}

TileManager.prototype.getAutotilerByID = function(autotilerID) {
    const autotiler = this.autotilers.get(autotilerID);

    if(!autotiler) {
        return null;
    }

    return autotiler;
}

TileManager.prototype.getAutotilerByVisual = function(mapID) {
    const tile = this.getTile(mapID);
    const { autotiler } = tile;

    return this.getAutotilerByID(autotiler);
}