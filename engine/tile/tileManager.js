import { TileVisual } from "./visual.js";
import { Autotiler } from "./autotiler.js";
import { Tile, TileCategory } from "./tile.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const TileManager = function() {
    this.categories = new Map();
    this.autotilers = new Map();
    this.visualMap = new Map();
    this.logicMap = new Map();
    this.tiles = [TileManager.EMPTY_TILE];
    this.tileTable = [];
    this.visuals = [];
    this.activeVisuals = [];
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
    const tileObject = new Tile(tileID, typeID, oldTile.autotiler);
    const index = mapID - 1;

    if(index >= 0 && index < this.tileTable.length) {
        this.tileTable[index] = tileID;
    }

    this.tiles.push(tileObject);

    return tileObject;
}

TileManager.prototype.createCategories = function(tileCategories) {
    for(const categoryID in tileCategories) {
        const category = new TileCategory(categoryID);

        this.categories.set(categoryID, category)
    }
}

TileManager.prototype.createLogicTiles = function(logicTiles, resolveType) {
    for(const logicID in logicTiles) {
        const { tileType = null, autotiler = null } = logicTiles[logicID];
        const tileID = this.tiles.length;
        const tile = new Tile(tileID, resolveType(tileType), autotiler);

        this.tiles.push(tile);
        this.logicMap.set(logicID, tileID);
    }
}

TileManager.prototype.createTiles = function(tileMeta) {
    let previousMapID = 1;
    let currentMapID = 1;

    //0 is treated as an empty visual => counting begins at 1.
    //Table maps a visual tile to logical tile.
    for(let i = 0; i < tileMeta.length; i++) {
        const { texture, category = null, logic = null, visuals = [], autoVisuals = {} } = tileMeta[i];
        const { count = 0, prefix = "" } = autoVisuals;
        let tileID = 0;

        if(this.logicMap.has(logic)) {
            tileID = this.logicMap.get(logic);
        }
        
        for(let j = 0; j < count; j++) {
            const visualName = texture + "::" + prefix + j;

            if(!this.visualMap.has(visualName)) {
                this.visualMap.set(visualName, currentMapID++);
            }
        }

        for(const name of visuals) {
            const visualName = texture + "::" + name;

            if(!this.visualMap.has(visualName)) {
                this.visualMap.set(visualName, currentMapID++);
            }
        }

        const visualCount = currentMapID - previousMapID;
        const categoryType = this.categories.get(category);

        if(categoryType) {
            for(let i = 0; i < visualCount; i++) {
                categoryType.addMember(previousMapID + i);
            }
        }

        //Matches mapID with tileID.
        //i - 1 because mapID is shifted by 1 in the table!
        for(let i = 0; i < visualCount; i++) {
            this.tileTable[previousMapID + i - 1] = tileID;
        }

        previousMapID = currentMapID;
    }
}

TileManager.prototype.createTileVisuals = function(textureLoader, tileAtlases, tileMeta) {
    let currentMapID = 1;

    textureLoader.createTileTextures(tileAtlases);

    for(const [visualID, index] of this.visualMap) {
        const [texture, regionID] = visualID.split("::");
        const visual = new TileVisual(currentMapID++);
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

    if(useAutoValues !== null) {
        for(let i = 0; i < autotiler.values.length; i++) {
            const name = `${useAutoValues}${i}`;
            const mapID = this.visualMap.get(name);

            if(mapID !== undefined) {
                autotiler.setValue(i, mapID);
            } else {
                console.error("VisualName does not exist!", name);
            }  
        }
    }

    for(const indexID in values) {
        const index = Number(indexID);
        const name = values[indexID];

        //null can be used to remove a specific value.
        if(name !== null) {
            const mapID = this.visualMap.get(name);

            if(mapID !== undefined) {
                autotiler.setValue(index, mapID);
            } else {
                console.error("VisualName does not exist!", name);
            }
        } else {
            autotiler.setValue(index, 0);
        }
    }

    return autotiler;
}


TileManager.prototype.loadServer = function(categories, logicTiles, visualTiles, autotilers, resolveType) {
    if(!categories || !logicTiles || !visualTiles || !autotilers) {
        return;
    }

    this.createCategories(categories);
    this.createLogicTiles(logicTiles, resolveType);
    this.createTiles(visualTiles);
    this.createAutotilers(autotilers);
}

TileManager.prototype.loadClient = function(textureLoader, tileAtlases, categories, logicTiles, visualTiles, autotilers, resolveType) {
    if(!categories || !tileAtlases || !visualTiles || !autotilers) {
        return;
    }

    this.createCategories(categories);
    this.createLogicTiles(logicTiles, resolveType);
    this.createTiles(visualTiles);
    this.createAutotilers(autotilers);
    this.createTileVisuals(textureLoader, tileAtlases, visualTiles);
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