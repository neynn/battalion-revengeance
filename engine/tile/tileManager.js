import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { Tile } from "./tile.js";

export const TileManager = function() {
    this.autotilers = new Map();
    this.metaInversion = {};
    this.tiles = [];
    this.visuals = [];
    this.activeVisuals = [];
}

TileManager.EMPTY_VISUAL = new TileVisual(-1);
TileManager.EMPTY_TILE = new Tile(-1, null, null, null, TileManager.EMPTY_VISUAL);

TileManager.TILE_ID = {
    EMPTY: 0,
    INVALID: -1
};

TileManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();

    for(let i = 0; i < this.activeVisuals.length; i++) {
        this.activeVisuals[i].updateFrameIndex(realTime);
    }
}

TileManager.prototype.createTiles = function(tileMeta) {
    for(let i = 0; i < tileMeta.length; i++) {
        const { id = null, type = null, autotiler = null, texture, tile } = tileMeta[i];
        const tileID = i + 1;
        const tileObject = new Tile(tileID, id, type, autotiler, TileManager.EMPTY_VISUAL);

        this.tiles.push(tileObject);

        if(id !== null && !this.metaInversion[id]) {
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

TileManager.prototype.createTileVisuals = function(resourceLoader, tileAtlases, tileMeta) {
    const textureMap = resourceLoader.createTextures(tileAtlases);
    const generatedVisuals = new Map();
    let id = 0;

    for(let i = 0; i < tileMeta.length; i++) {
        const { texture, tile } = tileMeta[i];
        const visualID = texture + "::" + tile;
        const tileObject = this.tiles[i];
        let fVisual = TileManager.EMPTY_VISUAL;

        if(generatedVisuals.has(visualID)) {
            fVisual = generatedVisuals.get(visualID);
        } else {
            const visual = new TileVisual(id++);
            const textureConfig = tileAtlases[texture];

            if(textureConfig) {
                visual.init(textureConfig, tile);
            }

            const textureID = textureMap[texture];
            const frameCount = visual.getFrameCount();

            if(frameCount > 0 && textureID !== undefined) {
                const textureObject = resourceLoader.getTexture(textureID);

                visual.setTexture(textureObject);
                textureObject.addReference();

                resourceLoader.loadTexture(textureID);
            }

            this.visuals.push(visual);

            generatedVisuals.set(visualID, visual);

            fVisual = visual;
        }

        tileObject.visual = fVisual;
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
    this.createTileVisuals(resourceLoader, tileAtlases, tileMeta);
    this.enableAllVisuals();
}

TileManager.prototype.createAutotiler = function(config) {
    const { type = Autotiler.TYPE.NONE, values = {}, members = [], autoMembers = [], useAutoValues = null } = config;
    const autotiler = new Autotiler(TileManager.TILE_ID.EMPTY);

    autotiler.setType(type);

    for(const { prefix, first, last } of autoMembers) {
        for(let i = first; i <= last; i++) {
            const cID = `${prefix}${i}`;
            const tileID = this.metaInversion[cID];

            if(tileID !== undefined) {
                autotiler.addMember(tileID);
            } else {
                console.error("cID does not exist!", cID);
            }  
        }
    }

    for(const cID of members) {
        const tileID = this.metaInversion[cID];

        if(tileID !== undefined) {
            autotiler.addMember(tileID);
        } else {
            console.error("cID does not exist!", cID);
        }
    }

    if(useAutoValues !== null) {
        for(let i = 0; i < autotiler.values.length; i++) {
            const cID = `${useAutoValues}${i}`;
            const tileID = this.metaInversion[cID];

            if(tileID !== undefined) {
                autotiler.setValue(i, tileID);
            } else {
                console.error("cID does not exist!", cID);
            }  
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

TileManager.prototype.getVisual = function(visualID) {
    for(let i = 0; i < this.visuals.length; i++) {
        if(this.visuals[i].id === visualID) {
            return this.visuals[i];
        }
    }

    return TileManager.EMPTY_VISUAL;
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

TileManager.prototype.enableVisual = function(visualID) {
    for(let i = 0; i < this.activeVisuals.length; i++) {
        if(this.activeVisuals[i].id === visualID) {
            return;
        }
    }

    const visual = this.getVisual(visualID);

    if(visual !== TileManager.EMPTY_VISUAL) {
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