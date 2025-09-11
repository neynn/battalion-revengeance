import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ObjectPool } from "../util/objectPool.js";
import { SpriteContainer } from "./spriteContainer.js";
import { ResourceLoader } from "../resources/resourceLoader.js";
import { SpriteHelper } from "./spriteHelper.js";
import { Texture } from "../resources/texture.js";

export const SpriteManager = function(resourceLoader) {
    this.resources = resourceLoader;
    this.sprites = new ObjectPool(1024, (index) => new Sprite(index, "EMPTY_SPRITE"));
    this.sprites.allocate();
    this.spriteTracker = new Set();
    this.spriteMap = new Map();
    this.containers = [];
    this.sharedSprites = [];
    this.timestamp = 0;

    this.layers = [];
    this.layers[SpriteManager.LAYER.BOTTOM] = [];
    this.layers[SpriteManager.LAYER.MIDDLE] = [];
    this.layers[SpriteManager.LAYER.TOP] = [];
    this.layers[SpriteManager.LAYER.UI] = [];
}

SpriteManager.LAYER = {
    BOTTOM: 0,
    MIDDLE: 1,
    TOP: 2,
    UI: 3
};

SpriteManager.prototype.addSpriteEntry = function(spriteID, containerIndex, textureID, alias = "::") {
    this.spriteMap.set(spriteID, {
        "index": containerIndex,
        "textureID": textureID,
        "copyAlias": alias
    });
}

SpriteManager.prototype.createSpriteAlias = function(spriteID, schemaID) {
    const index = this.getContainerIndex(spriteID);
    const container = this.getContainer(index);
    const aliasID = SpriteHelper.getSchemaID(spriteID, schemaID);

    if(container && !this.spriteMap.has(aliasID)) {
        this.addSpriteEntry(aliasID, index, container.texture.getID());
    }
}

SpriteManager.prototype.createCopyTexture = function(spriteID, schemaID, schema) {
    const index = this.getContainerIndex(spriteID);
    const container = this.getContainer(index);
    const aliasID = SpriteHelper.getSchemaID(spriteID, schemaID);

    if(container && !this.spriteMap.has(aliasID)) {
        const { texture } = container;
        const textureID = texture.getID();
        const texureAlias = SpriteHelper.getSchemaID(texture.getID(), schemaID);
        const copyTexture = this.resources.createCopyTexture(texureAlias, texture);

        this.addSpriteEntry(aliasID, index, copyTexture.getID(), texureAlias);

        if(copyTexture.state === Texture.STATE.EMPTY) {
            switch(texture.state) {
                case Texture.STATE.EMPTY: {
                    this.resources.loadTexture(textureID);
                    this.resources.events.on(ResourceLoader.EVENT.TEXTURE_LOADED, (texture, bitmap) => {
                        copyTexture.loadColoredBitmap(bitmap, schema);
                    }, { once: true });
                    break;
                }
                case Texture.STATE.LOADING: {
                    this.resources.events.on(ResourceLoader.EVENT.TEXTURE_LOADED, (texture, bitmap) => {
                        copyTexture.loadColoredBitmap(bitmap, schema);
                    }, { once: true });
                    break;
                }
                case Texture.STATE.LOADED: {
                    copyTexture.loadColoredBitmap(texture.bitmap, schema);
                    break;
                }
            }
        }
    }
}

SpriteManager.prototype.load = function(textures, sprites) {
    if(!textures || !sprites) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Textures/Sprites do not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    const textureMap = this.resources.createTextures(textures);
    
    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, bounds, frameTime, frames, autoFrames } = spriteConfig;
        const textureID = textureMap[texture];

        if(textureID === undefined || (!frames && !autoFrames)) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        let frameCount = 0;
        const textureObject = this.resources.getTextureByID(textureID);
        const spriteContainer = new SpriteContainer(textureObject, bounds, frameTime);

        if(autoFrames) {
            frameCount = spriteContainer.initAutoFrames(autoFrames);
        } else {
            frameCount = spriteContainer.initFrames(frames);
        }

        if(frameCount === 0) {
            console.warn(`Sprite ${spriteID} has no frames!`);
            continue;
        }

        this.containers.push(spriteContainer);
        this.addSpriteEntry(spriteID, this.containers.length - 1, textureID);
    }
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const removedSprites = [];

    this.timestamp = realTime;

    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites[i];
        const sprite = this.getSprite(index);

        sprite.update(realTime, deltaTime);
    }

    for(const index of this.sprites.reservedElements) {
        const sprite = this.sprites.elements[index];

        if(sprite.hasFlag(Sprite.FLAG.DESTROY)) {
            removedSprites.push(index);
        }
    }

    for(let i = 0; i < removedSprites.length; i++) {
        this.destroySprite(removedSprites[i]);
    }
}

SpriteManager.prototype.exit = function() {
    this.spriteTracker.clear();
    this.sprites.forAllReserved((sprite) => sprite.closeGraph());
    this.sprites.reset();
    this.sharedSprites.length = 0;

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return [];
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.getContainer = function(index) {
    if(index < 0 || index >= this.containers.length) {
        return null;
    }

    return this.containers[index];
}

SpriteManager.prototype.getContainerIndex = function(spriteID) {
    const data = this.spriteMap.get(spriteID);

    if(!data) {
        return -1;
    }

    const { index } = data;

    return index;
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

    const sprite = this.sprites.reserveElement();

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "SpritePool is full!", "SpriteManager.prototype.createSprite", null);
        return null;
    }

    sprite.reset();

    const spriteID = sprite.getID();
    const spriteIndex = sprite.getIndex();

    this.spriteTracker.add(spriteID);
    this.sharedSprites.push({
        "id": typeID,
        "index": spriteIndex
    });
    this.updateSpriteTexture(sprite, typeID);

    return sprite;
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null) {
    const sprite = this.sprites.reserveElement();

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "SpritePool is full!", "SpriteManager.prototype.createSprite", null);
        return null;
    }

    sprite.reset();

    if(layerID !== null) {
        this.addToLayer(sprite, layerID);
    }

    const spriteID = sprite.getID();

    this.spriteTracker.add(spriteID);
    this.updateSpriteTexture(sprite, typeID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.destroySprite", { "spriteID": spriteIndex });
        return [];
    }
    
    const graph = sprite.getGraph();
    const invalidElements = [];

    for(let i = graph.length - 1; i >= 0; i--) {
        const node = graph[i];
        const nodeID = node.getID();

        if(!this.spriteTracker.has(nodeID)) {
            invalidElements.push(node);
            continue;
        }

        const index = node.getIndex();
        const isReserved = this.sprites.isReserved(index);

        if(!isReserved) {
            continue;
        }

        node.closeGraph();

        this.removeSpriteFromLayers(index);
        this.sprites.freeElement(index);
        this.spriteTracker.delete(nodeID);
    }
    
    return invalidElements;
}

SpriteManager.prototype.getSprite = function(spriteIndex) {
    return this.sprites.getReservedElement(spriteIndex);
}

SpriteManager.prototype.swapLayer = function(spriteIndex, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist!", "SpriteManager.prototype.swapLayer", { "layer": layerIndex });
        return;
    }

    const sprite = this.sprites.getReservedElement(spriteIndex);

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

SpriteManager.prototype.updateSpriteTexture = function(sprite, spriteID) {
    const spriteEntry = this.spriteMap.get(spriteID);

    if(spriteEntry) {
        const { index, textureID, copyAlias } = spriteEntry;
        const container = this.getContainer(index);

        if(container) {
            sprite.init(container, this.timestamp, spriteID);

            if(textureID === ResourceLoader.COPY_ID) {
                const copyTexture = this.resources.getCopyTexture(copyAlias);

                sprite.setTexture(copyTexture);
            } else {
                const { texture } = container;

                sprite.setTexture(texture);

                if(texture.state === Texture.STATE.EMPTY) {
                    this.resources.loadTexture(textureID);
                }
            }
        }
    }
}

SpriteManager.prototype.updateSprite = function(spriteIndex, spriteID) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    this.updateSpriteTexture(sprite, spriteID);
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
    
    return null;
}

SpriteManager.prototype.clearShared = function() {
    for(let i = 0; i < this.sharedSprites.length; i++) {
        const { id, index } = this.sharedSprites;

        this.destroySprite(index);
    }

    this.sharedSprites.length = 0;
}