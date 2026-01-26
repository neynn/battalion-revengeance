import { Autotiler } from "./autotiler.js";
import { Tile } from "./tile.js";

export const TileManager = function() {
    this.autotilers = new Map();
    this.metaInversion = {};
    this.activeTiles = [];
    this.tiles = [];
}

TileManager.EMPTY_TILE = new Tile(-1, null, null);

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    for(let i = 0; i < this.activeTiles.length; i++) {
        this.activeTiles[i].updateFrameIndex(realTime);
    }
}

TileManager.prototype.createTiles = function(tileMeta) {
    for(let i = 0; i < tileMeta.length; i++) {
        const { id = null, type = null, autotiler = null, texture, tile } = tileMeta[i];
        const tileID = i + 1;
        const tileObject = new Tile(tileID, id, type, autotiler);

        this.tiles.push(tileObject);

        if(!this.metaInversion[id]) {
            this.metaInversion[id] = tileID;
        }
    }
}

TileManager.prototype.createAutotilers = function(autotilers) {
    for(const autotilerID in autotilers) {
        const autotiler = this.createAutotiler(autotilers[autotilerID]);

        this.autotilers.set(autotilerID, autotiler);
    }
}

TileManager.prototype.createTileTextures = function(resourceLoader, tileAtlases, tileMeta) {
    const textureMap = resourceLoader.createTextures(tileAtlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { texture, tile } = tileMeta[i];
        const textureConfig = tileAtlases[texture];
        const tileObject = this.tiles[i];

        if(textureConfig) {
            tileObject.init(textureConfig, tile);
        }

        const textureID = textureMap[texture];
        const frameCount = tileObject.getFrameCount();

        if(frameCount > 0 && textureID !== undefined) {
            const textureObject = resourceLoader.getTextureByID(textureID);

            tileObject.setTexture(textureObject);
            textureObject.addReference();

            resourceLoader.loadTexture(textureID);
        }
    }
}

TileManager.prototype.loadServer = function(tileMeta, autotilers) {
    if(!tileMeta || !autotilers) {
        console.warn("TileMeta/Autotilers does not exist!");
        return;
    }

    this.createTiles(tileMeta);
    this.createAutotilers(autotilers);
}

TileManager.prototype.load = function(resourceLoader, tileAtlases, tileMeta, autotilers) {
    if(!tileAtlases || !tileMeta || !autotilers) {
        console.warn("TileAtlases/TileMeta/Autotilers does not exist!");
        return;
    }

    this.createTiles(tileMeta);
    this.createAutotilers(autotilers);
    this.createTileTextures(resourceLoader, tileAtlases, tileMeta);
    this.enableAllTiles();
}

TileManager.prototype.createAutotiler = function(config) {
    const { type = Autotiler.TYPE.NONE, values = {}, members = [] } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(const cID of members) {
        const tileID = this.metaInversion[cID];

        if(tileID !== undefined) {
            autotiler.addMember(tileID);
        } else {
            console.error("cID does not exist!", cID);
        }
    }

    for(const indexID in values) {
        const cID = values[indexID];
        const tileID = this.metaInversion[cID];

        if(tileID !== undefined) {
            const index = Number(indexID);

            autotiler.setValue(index, tileID);
        } else {
            console.error("cID does not exist!", cID);
        }
    }

    return autotiler;
}

TileManager.prototype.disableTile = function(tileID) {
    for(let i = 0; i < this.activeTiles.length; i++) {
        if(this.activeTiles[i].id === tileID) {
            this.activeTiles[i].reset();
            this.activeTiles[i] = this.activeTiles[this.activeTiles.length - 1];
            this.activeTiles.pop();
            break;
        }
    }
}

TileManager.prototype.enableTile = function(tileID) {
    const tile = this.getTile(tileID);

    if(tile !== TileManager.EMPTY_TILE) {
        for(let i = 0; i < this.activeTiles.length; i++) {
            if(this.activeTiles[i].id === tileID) {
                return;
            }
        }

        this.activeTiles.push(tile);
    }
}

TileManager.prototype.enableAllTiles = function() {
    this.activeTiles.length = 0;

    for(let i = 0; i < this.tiles.length; i++) {
        if(this.tiles[i].frameCount > 1) {
            this.activeTiles.push(this.tiles[i]);
        }
    }
}

TileManager.prototype.disableAllTiles = function() {
    for(let i = 0; i < this.activeTiles.length; i++) {
        this.activeTiles[i].reset();
    }

    this.activeTiles.length = 0;
}

TileManager.prototype.getTile = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.tiles.length) {
        return TileManager.EMPTY_TILE;
    }

    return this.tiles[index];
}

TileManager.prototype.getTileCount = function() {
    //+1 because 0 is treated as an empty tile -> counting begins at 1.
    return this.tiles.length + 1;
}

TileManager.prototype.hasTile = function(tileID) {
    const index = tileID - 1;

    return index >= 0 && index < this.tiles.length;
}

TileManager.prototype.getAutotilerByID = function(autotilerID) {
    const autotiler = this.autotilers.get(autotilerID);

    if(!autotiler) {
        return null;
    }

    return autotiler;
}

TileManager.prototype.getAutotilerByTile = function(tileID) {
    const tile = this.getTile(tileID);
    const { autotiler } = tile;

    return this.getAutotilerByID(autotiler);
}