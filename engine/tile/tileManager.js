import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { Tile, TileCategory } from "./tile.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const TileManager = function() {
    this.autotilers = new Map();
    this.tiles = [];
    this.tileTable = [];
    this.visuals = [];
    this.activeVisuals = [];

    this.categories = new Map();
    this.categoryID = 0;
}

TileManager.EMPTY_VISUAL = new TileVisual(-1);
TileManager.EMPTY_TILE = new Tile(-1, -1, null);

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

TileManager.prototype.addCustomTile = function(mapID, typeID) {
    const oldTile = this.getTile(mapID);
    const tileID = this.tiles.length;
    const tileObject = new Tile(tileID, typeID, oldTile.autotiler, oldTile.category);
    const index = mapID - 1;

    if(index >= 0 && index < this.tileTable.length) {
        this.tileTable[index] = tileID;
    }

    this.tiles.push(tileObject);

    return tileObject;
}

TileManager.prototype.createTiles = function(tileMeta, resolveType) {
    const visualMap = {};
    let mapID = 0;

    //0 is treated as an empty visual => counting begins at 1.
    //Table maps a visual tile to logical tile.
    for(let i = 0; i < tileMeta.length; i++) {
        const { category = null, id = null, type = null, autotiler = null, variants } = tileMeta[i];
        let tileID = this.tiles.length;
        let count = 1;
        let visualID = mapID;
        let categoryID = -1;

        if(variants) {
            count = variants.count;

            if(id !== null) {
                for(let j = 0; j < count; j++) {
                    const tileName = id + j;

                    if(visualMap[tileName] === undefined) {
                        visualMap[tileName] = ++visualID;
                    }
                }
            }
        } else {
            if(id !== null && visualMap[id] === undefined) {
                visualMap[id] = ++visualID;
            }
        }

        if(category !== null) {
            if(this.categories.has(category)) {
                categoryID = this.categories.get(category).id;
            } else {
                categoryID = this.categoryID++;
                this.categories.set(category, new TileCategory(categoryID));
            }
        }

        const typeID = resolveType(type);
        const tileObject = new Tile(tileID, typeID, autotiler, categoryID);

        this.tiles.push(tileObject);

        if(category !== null) {
            const categoryType = this.categories.get(category);

            for(let i = 0; i < count; i++) {
                categoryType.addMember(mapID + i);
            }
        }

        //Matches mapID with tileID.
        for(let i = 0; i < count; i++) {
            this.tileTable[mapID + i] = tileID;
        }

        mapID += count;
    }

    return visualMap;
}

TileManager.prototype.createTileVisuals = function(textureLoader, tileAtlases, tileMeta) {
    textureLoader.createTileTextures(tileAtlases);

    const generatedVisuals = new Set();
    let mapID = 1;

    const createVisual = (textureName, regionID) => {
        const visual = new TileVisual(mapID++);
        const textureConfig = tileAtlases[textureName];
        const textureID = textureLoader.getTileID(textureName);

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

    for(let i = 0; i < tileMeta.length; i++) {
        const { variants, texture, tile } = tileMeta[i];

        if(variants) {
            const { count, prefix } = variants;

            for(let j = 0; j < count; j++) {
                const visualID = texture + "::" + prefix + j;

                if(!generatedVisuals.has(visualID)) {
                    createVisual(texture, prefix + j);
                    generatedVisuals.add(visualID);
                }
            }
        } else {
            const visualID = texture + "::" + tile;

            if(!generatedVisuals.has(visualID)) {
                createVisual(texture, tile);
                generatedVisuals.add(visualID);
            }
        }
    }
}

TileManager.prototype.createAutotilers = function(autotilers, visualMap) {
    for(const autotilerID in autotilers) {
        const autotiler = this.createAutotiler(autotilers[autotilerID], visualMap);

        this.autotilers.set(autotilerID, autotiler);
    }
}

TileManager.prototype.createAutotiler = function(config, visualMap) {
    const { type = Autotiler.TYPE.NONE, values = {}, categories = [], useAutoValues = null } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(const categoryID of categories) {
        const category = this.categories.get(categoryID);

        if(category) {
            autotiler.addCategory(category);
        }
    }

    if(useAutoValues !== null) {
        for(let i = 0; i < autotiler.values.length; i++) {
            const namedID = `${useAutoValues}${i}`;
            const mapID = visualMap[namedID];

            if(mapID !== undefined) {
                autotiler.setValue(i, mapID);
            } else {
                console.error("namedID does not exist!", namedID);
            }  
        }
    }

    for(const indexID in values) {
        const namedID = values[indexID];
        const mapID = visualMap[namedID];

        if(mapID !== undefined) {
            const index = Number(indexID);

            autotiler.setValue(index, mapID);
        } else {
            console.error("namedID does not exist!", namedID);
        }
    }

    return autotiler;
}


TileManager.prototype.loadServer = function(tileMeta, autotilers, resolveType) {
    if(!tileMeta || !autotilers) {
        console.warn("TileMeta/Autotilers does not exist!");
        return;
    }

    const visualMap = this.createTiles(tileMeta, resolveType);

    this.createAutotilers(autotilers, visualMap);
}

TileManager.prototype.loadClient = function(textureLoader, tileAtlases, tileMeta, autotilers, resolveType) {
    if(!tileAtlases || !tileMeta || !autotilers) {
        console.warn("TileAtlases/TileMeta/Autotilers does not exist!");
        return;
    }

    const visualMap = this.createTiles(tileMeta, resolveType);

    this.createAutotilers(autotilers, visualMap);
    this.createTileVisuals(textureLoader, tileAtlases, tileMeta);
    this.enableAllVisuals();
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
    const index = mapID - 1;

    if(index < 0 || index >= this.tileTable.length) {
        return TileManager.EMPTY_TILE;
    }

    return this.tiles[this.tileTable[index]];
}

TileManager.prototype.getVisual = function(mapID) {
    const index = mapID - 1;

    if(index < 0 || index >= this.visuals.length) {
        return TileManager.EMPTY_VISUAL;
    }

    return this.visuals[index];
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