import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ObjectPool } from "../util/objectPool.js";
import { SpriteContainer } from "./spriteContainer.js";
import { Texture } from "../resources/texture.js";
import { TextureRegistry } from "../resources/textureRegistry.js";

export const SpriteManager = function(resourceLoader) {
    this.resources = resourceLoader;
    this.spriteTracker = new Set();
    this.spriteMap = new Map();
    this.containers = [];
    this.sharedSprites = [];
    this.timestamp = 0;
    this.nextCleanup = 0;
    this.pool = new ObjectPool(1024, (index) => new Sprite(index, "EMPTY_SPRITE"));
    this.layers = [];
}

SpriteManager.SECONDS_TO_CLEANUP = 5;
SpriteManager.ALIAS_SEPERATOR = "::";
SpriteManager.EMPTY_SPRITE = new Sprite(-1, "EMPTY_SPRITE");
SpriteManager.EMPTY_LAYER = [];

SpriteManager.prototype.load = function(textures, sprites) {
    if(!textures || !sprites) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Textures/Sprites do not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    const textureMap = this.resources.createTextures(textures);
    
    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, shift, bounds, frameTime, spriteTime, frames, autoFrames } = spriteConfig;
        const textureID = textureMap[texture];

        if(textureID === undefined || (!frames && !autoFrames)) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const textureObject = this.resources.getTextureByID(textureID);
        const regionFrames = frames !== undefined ? textureObject.getFrames(frames) : textureObject.getFramesAuto(autoFrames);

        if(regionFrames.length !== 0) {
            const spriteContainer = new SpriteContainer(spriteID, regionFrames);

            if(spriteTime !== undefined) {
                spriteContainer.setSpriteTime(spriteTime);
            } else {
                spriteContainer.setFrameTime(frameTime);
            }

            if(shift) {
                spriteContainer.loadShift(shift);
            }

            if(bounds) {
                spriteContainer.loadBounds(bounds);
            } else {
                spriteContainer.loadDefaultBounds();
            }

            this.containers.push(spriteContainer);
            this.addSpriteEntry(spriteID, this.containers.length - 1, textureID);
        } else {
            console.warn(`Sprite ${spriteID} has no frames!`);
        }
    }
}

SpriteManager.prototype.forEachSprite = function(onCall) {
    if(typeof onCall === "function") {
        this.pool.forAllReserved(onCall);
    }
}

SpriteManager.prototype.getAlias = function(spriteID, schemaID) {
    return spriteID + SpriteManager.ALIAS_SEPERATOR + schemaID;
}

SpriteManager.prototype.addSpriteEntry = function(spriteID, containerIndex, textureID, alias = SpriteManager.ALIAS_SEPERATOR) {
    this.spriteMap.set(spriteID, {
        "index": containerIndex,
        "textureID": textureID,
        "copyAlias": alias
    });
}

SpriteManager.prototype.addSharedEntry = function(spriteID, index) {
    this.sharedSprites.push({
        "id": spriteID,
        "index": index
    });
}

SpriteManager.prototype.getSpriteDuration = function(spriteID) {
    const spriteEntry = this.spriteMap.get(spriteID);

    if(spriteEntry) {
        const { index } = spriteEntry;
        const container = this.getContainer(index);

        if(container) {
            return container.totalFrameTime;
        }
    }

    return 1;
}

SpriteManager.prototype.createSpriteAlias = function(spriteID, schemaID) {
    const spriteEntry = this.spriteMap.get(spriteID);
    const aliasID = this.getAlias(spriteID, schemaID);

    if(!spriteEntry || this.spriteMap.has(aliasID)) {
        return spriteID;
    }

    const { index, textureID } = spriteEntry;

    this.addSpriteEntry(aliasID, index, textureID);

    return aliasID;
}

SpriteManager.prototype.createCopyTexture = function(spriteID, schemaID, schema) {
    const spriteEntry = this.spriteMap.get(spriteID);
    const aliasID = this.getAlias(spriteID, schemaID);

    if(!spriteEntry || this.spriteMap.has(aliasID)) {
        return null;
    }

    const { index, textureID } = spriteEntry;
    const texureAlias = this.getAlias(textureID, schemaID);
    const texture = this.resources.getTextureByID(textureID);
    const copyTexture = this.resources.createCopyTexture(texureAlias, texture);

    this.addSpriteEntry(aliasID, index, copyTexture.getID(), texureAlias);

    if(copyTexture.state === Texture.STATE.EMPTY) {
        switch(texture.state) {
            case Texture.STATE.EMPTY: {
                this.resources.loadTexture(textureID);
                this.resources.addLoadResolver(textureID, (bitmap) => copyTexture.loadColoredRegions(bitmap, schema));
                break;
            }
            case Texture.STATE.LOADING: {
                this.resources.addLoadResolver(textureID, (bitmap) => copyTexture.loadColoredRegions(bitmap, schema));
                break;
            }
            case Texture.STATE.LOADED: {
                copyTexture.loadColoredRegions(texture.bitmap, schema);
                break;
            }
        }
    }

    return copyTexture;
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    this.timestamp = realTime;

    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites[i];
        const sprite = this.pool.getElement(index);

        sprite.update(realTime, deltaTime);
    }

    if(this.timestamp >= this.nextCleanup) {
        const removedSprites = [];

        for(const index of this.pool.reservedElements) {
            const sprite = this.pool.elements[index];

            if(sprite.hasFlag(Sprite.FLAG.DESTROY)) {
                removedSprites.push(index);
            }
        }

        for(let i = 0; i < removedSprites.length; i++) {
            this.destroySprite(removedSprites[i]);
        }

        this.nextCleanup = this.timestamp + SpriteManager.SECONDS_TO_CLEANUP;
    }
}

SpriteManager.prototype.destroyCopyTextures = function() {
    const toDestroy = [];

    for(const [spriteID, entry] of this.spriteMap) {
        const { index, textureID, copyAlias } = entry;

        if(textureID === TextureRegistry.EMPTY_ID) {
            this.resources.destroyCopyTexture(copyAlias);
            toDestroy.push(spriteID);
        }
    }

    for(let i = 0; i < toDestroy.length; i++) {
        this.spriteMap.delete(toDestroy[i]);
    }
}

SpriteManager.prototype.exit = function() {
    this.spriteTracker.clear();
    this.pool.forAllReserved((sprite) => {
        sprite.reset();
        sprite.close();
    });
    this.pool.reset();
    this.destroyCopyTextures();
    this.sharedSprites.length = 0;

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.addLayer = function() {
    this.layers.push([]);
}

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return SpriteManager.EMPTY_LAYER;
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.getContainer = function(index) {
    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    return this.containers[index];
}

SpriteManager.prototype.loadBitmap = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(data) {
        const { textureID } = data;

        this.resources.loadTexture(textureID);
    }
}

SpriteManager.prototype.removeReference = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(data) {
        //TODO: Unload textures.
    }
}

SpriteManager.prototype.createSharedSprite = function(typeID) {
    const sharedSprite = this.getSharedSprite(typeID);

    if(sharedSprite) {
        return sharedSprite;
    }

    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    const spriteID = sprite.getID();
    const spriteIndex = sprite.getIndex();

    this.spriteTracker.add(spriteID);
    this.addSharedEntry(typeID, spriteIndex);
    this.updateSprite(spriteIndex, typeID);

    return sprite;
}

SpriteManager.prototype.createEmptySprite = function(layerID = null) {
    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    if(layerID !== null) {
        this.addToLayer(sprite, layerID);
    }

    const spriteID = sprite.getID();

    this.spriteTracker.add(spriteID);

    return sprite;
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null) {
    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    if(layerID !== null) {
        this.addToLayer(sprite, layerID);
    }

    const spriteID = sprite.getID();
    const spriteIndex = sprite.getIndex();

    this.spriteTracker.add(spriteID);
    this.updateSprite(spriteIndex, typeID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.destroySprite", { "spriteID": spriteIndex });
        return [];
    }
    
    const graph = sprite.getGraph();
    const invalidElements = [];

    sprite.reset();

    for(let i = graph.length - 1; i >= 0; i--) {
        const node = graph[i];
        const nodeID = node.getID();

        if(!this.spriteTracker.has(nodeID)) {
            invalidElements.push(node);
            continue;
        }

        const index = node.getIndex();
        const isReserved = this.pool.isReserved(index);

        if(isReserved) {
            node.close();

            this.removeSpriteFromLayers(index);
            this.pool.freeElement(index);
            this.spriteTracker.delete(nodeID);
        }
    }
    
    return invalidElements;
}

SpriteManager.prototype.getSprite = function(spriteIndex) {
    return this.pool.getReservedElement(spriteIndex);
}

SpriteManager.prototype.swapLayer = function(spriteIndex, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist!", "SpriteManager.prototype.swapLayer", { "layer": layerIndex });
        return;
    }

    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.swapLayer", { "spriteID": spriteIndex });
        return;
    }

    this.removeSpriteFromLayers(spriteIndex);
    this.addToLayer(sprite, layerIndex);
}

SpriteManager.prototype.addToLayer = function(sprite, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist!", "SpriteManager.prototype.addToLayer", { "layer": layerIndex });
        return;
    }

    const layer = this.layers[layerIndex];
    const index = layer.findIndex(member => member.index === sprite.index);

    if(index !== -1) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", { "layer": layerIndex });
        return;
    }

    layer.push(sprite);
}

SpriteManager.prototype.removeSpriteFromLayers = function(spriteIndex) {
    for(let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i];
        const index = layer.findIndex(member => member.index === spriteIndex);

        if(index !== -1) {
            layer[index] = layer[layer.length - 1];
            layer.pop();
        }
    }
}

SpriteManager.prototype.updateSprite = function(spriteIndex, spriteID) {
    const sprite = this.pool.getReservedElement(spriteIndex);
    const spriteEntry = this.spriteMap.get(spriteID);

    if(!sprite || !spriteEntry) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteType/Sprite does not exist!", "SpriteManager.prototype.updateSprite", { "spriteIndex": spriteIndex, "spriteID": spriteID });
        return;
    }

    const { index, textureID, copyAlias } = spriteEntry;
    const container = this.getContainer(index);

    if(container) {
        sprite.init(container, this.timestamp, spriteID);

        if(textureID === TextureRegistry.EMPTY_ID) {
            const copyTexture = this.resources.getCopyTexture(copyAlias);

            sprite.setTexture(copyTexture);
        } else {
            const texture = this.resources.getTextureByID(textureID);

            sprite.setTexture(texture);

            if(texture.state === Texture.STATE.EMPTY) {
                this.resources.loadTexture(textureID);
            }
        }
    }
}

SpriteManager.prototype.isShared = function(spriteID, spriteIndex) {
    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites[i];

        if(index === spriteIndex || id === spriteID) {
            return true;
        }
    }

    return false;
}

SpriteManager.prototype.removeShared = function(spriteID) {
    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites[i];

        if(id === spriteID) {
            this.destroySprite(index);
            this.sharedSprites[i] = this.sharedSprites[this.sharedSprites.length - 1];
            this.sharedSprites.pop();
            break;
        }
    }
}

SpriteManager.prototype.getSharedSprite = function(spriteID) {
    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites[i];

        if(id === spriteID) {
            return this.getSprite(index);
        }
    }
    
    return SpriteManager.EMPTY_SPRITE;
}

SpriteManager.prototype.clearShared = function() {
    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites;

        this.destroySprite(index);
    }

    this.sharedSprites.length = 0;
}

SpriteManager.prototype.updateSpriteWithAlias = function(spriteIndex, spriteID, schemaID) {
    const aliasID = this.getAlias(spriteID, schemaID);

    this.createSpriteAlias(spriteID, schemaID);
    this.updateSprite(spriteIndex, aliasID);
}

SpriteManager.prototype.createSpriteWithAlias = function(spriteID, schemaID, layerID) {
    const aliasID = this.getAlias(spriteID, schemaID);

    this.createSpriteAlias(spriteID, schemaID);

    return this.createSprite(aliasID, layerID);
}

SpriteManager.prototype.updateColoredSprite = function(spriteIndex, spriteID, schemaID, schemaType) {
    const aliasID = this.getAlias(spriteID, schemaID);

    this.createCopyTexture(spriteID, schemaID, schemaType);
    this.updateSprite(spriteIndex, aliasID);
}

SpriteManager.prototype.createColoredSprite = function(spriteID, schemaID, schemaType, layerID) {
    const aliasID = this.getAlias(spriteID, schemaID);

    this.createCopyTexture(spriteID, schemaID, schemaType);

    return this.createSprite(aliasID, layerID);
}