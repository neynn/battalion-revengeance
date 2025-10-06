import { Autotiler } from "./autotiler.js";
import { Tile } from "./tile.js";

export const TileManager = function(resourceLoader) {
    this.resources = resourceLoader;
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

TileManager.prototype.load = function(tileAtlases, tileMeta, autotilers) {
    if(!tileAtlases || !tileMeta) {
        console.warn("TileAtlases/TileMeta does not exist!");
        return;
    }

    const textureMap = this.resources.createTextures(tileAtlases);

    for(let i = 0; i < tileMeta.length; i++) {
        const { type = null, autotiler = null, texture, tile } = tileMeta[i];
        const tileID = i + 1;
        const tileObject = new Tile(tileID, type, autotiler);
        const textureConfig = tileAtlases[texture];

        if(textureConfig) {
            tileObject.init(textureConfig, tile);
        }

        const textureID = textureMap[texture];
        const frameCount = tileObject.getFrameCount();

        if(frameCount > 0 && textureID !== undefined) {
            const textureObject = this.resources.getTextureByID(textureID);

            tileObject.setTexture(textureObject);
            textureObject.addReference();

            this.resources.loadTexture(textureID);
        }

        this.tiles.push(tileObject);

        if(!this.metaInversion[texture]) {
            this.metaInversion[texture] = {};
        }

        this.metaInversion[texture][tile] = tileID;
    }

    if(!autotilers) {
        console.warn("Autotilers do not exist!");
        return;
    }
    
    for(const autotilerID in autotilers) {
        const autotiler = this.createAutotiler(autotilers[autotilerID]);

        this.autotilers.set(autotilerID, autotiler);
    }

    this.enableAllTiles();
}

TileManager.prototype.createAutotiler = function(config) {
    const { type = Autotiler.TYPE.NONE, values = {}, members = [] } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(let i = 0; i < members.length; i++) {
        const [atlas, texture] = members[i];
        const tileID = this.getTileID(atlas, texture);

        if(tileID !== TileManager.TILE_ID.EMPTY) {
            autotiler.addMember(tileID);
        }
    }

    for(const indexID in values) {
        const graphics = values[indexID];

        if(graphics) {
            const [atlas, texture] = graphics;
            const tileID = this.getTileID(atlas, texture);
            const index = Number(indexID);

            autotiler.setValue(index, tileID);
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

TileManager.prototype.getInversion = function() {
    return this.metaInversion;
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

TileManager.prototype.getTileIDByArray = function(overlay) {
    if(!overlay) {
        return TileManager.TILE_ID.EMPTY;
    }

    const [atlas, texture] = overlay;
    const tileID = this.getTileID(atlas, texture);

    return tileID;
}

TileManager.prototype.getTileID = function(atlasID, textureID) {
    const atlas = this.metaInversion[atlasID];

    if(!atlas) {
        return TileManager.TILE_ID.EMPTY;
    }

    const tileID = atlas[textureID];

    if(tileID === undefined) {
        return TileManager.TILE_ID.EMPTY;
    }

    return tileID;
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