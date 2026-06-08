import { Sprite } from "./sprite.js";
import { ObjectPool } from "../util/objectPool.js";
import { SpriteContainer } from "./spriteContainer.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";
import { Texture } from "../resources/texture/texture.js";

export const SpriteManager = function(textureLoader) {
    this.resources = textureLoader;
    this.spriteTracker = new Set();
    this.containerMap = new Map();
    this.containers = [];
    this.sharedSprites = [];
    this.timestamp = 0;
    this.nextCleanup = 0;
    this.pool = new ObjectPool(1024, (index) => new Sprite(index, "EMPTY_SPRITE"));
    this.layers = [];
}

SpriteManager.INVALID_ID = -1;
SpriteManager.SECONDS_TO_CLEANUP = 5;
SpriteManager.EMPTY_SPRITE = new Sprite(SpriteManager.INVALID_ID, "EMPTY_SPRITE");
SpriteManager.EMPTY_LAYER = [];

SpriteManager.prototype.getSpriteID = function(name) {
    const index = this.containerMap.get(name);

    if(index === undefined) {
        return SpriteManager.INVALID_ID;
    }

    return index;
}

SpriteManager.prototype.load = function(textures, sprites) {
    if(!textures || !sprites) {
        return;
    }
    
    this.resources.createSpriteTextures(textures);

    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, shift, anchor, bounds, frameTime, spriteTime, frames, autoFrames } = spriteConfig;
        const textureID = this.resources.getSpriteID(texture);

        if(textureID === TextureRegistry.INVALID_ID || (!frames && !autoFrames)) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const textureObject = this.resources.getTexture(textureID);
        const containerID = this.containers.length;
        const spriteContainer = new SpriteContainer(containerID, textureObject);

        if(frames === undefined) {
            spriteContainer.loadFramesAuto(autoFrames);
        } else {
            spriteContainer.loadFrames(frames);
        }

        if(spriteTime !== undefined) {
            spriteContainer.setSpriteTime(spriteTime);
        } else {
            spriteContainer.setFrameTime(frameTime);
        }

        if(bounds) {
            spriteContainer.loadBounds(bounds);
        } else {
            spriteContainer.loadDefaultBounds();
        }

        if(anchor) {
            spriteContainer.loadAnchor(anchor);
        } else if(shift) {
            spriteContainer.loadShift(shift);
        }

        if(spriteContainer.frameCount === 0) {
            console.warn(`SpriteContainer ${spriteID} has 0 frames!`);
        }

        this.containers.push(spriteContainer);
        this.containerMap.set(spriteID, containerID);
    }
}

SpriteManager.prototype.createShadeTask = function(spriteID, target) {
    if(spriteID < 0 || spriteID >= this.containers.length) {
        return;
    }

    const container = this.containers[spriteID];
    const { texture, frames, frameCount } = container;
    const { id } = texture;

    if(frameCount > 0) {
        this.resources.addShadeTask(id, frames[0], target);
    }
}

SpriteManager.prototype.forEachSprite = function(onCall) {
    if(typeof onCall === "function") {
        this.pool.forAllReserved(onCall);
    }
}

SpriteManager.prototype.addSharedEntry = function(spriteID, index) {
    this.sharedSprites.push({
        "id": spriteID,
        "index": index
    });
}

SpriteManager.prototype.getSpriteDuration = function(spriteID) {
    if(spriteID < 0 || spriteID >= this.containers.length) {
        return 1;
    }

    const container = this.containers[spriteID];
    const { totalFrameTime } = container;

    return totalFrameTime;
}

SpriteManager.prototype.createCopyTexture = function(spriteID, colorID, colorMap) {
    //TODO(neyn): Replace with numbers.
    if(typeof spriteID !== "number") {
        spriteID = this.getSpriteID(spriteID);
    }

    if(spriteID < 0 || spriteID >= this.containers.length) {
        return;
    }

    const container = this.containers[spriteID];
    const { texture } = container;
    const { id } = texture;

    this.resources.addRecolorTask(id, colorID, colorMap);
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

SpriteManager.prototype.clear = function() {
    const textures = this.resources.textureRegistry.textures;
    const registry = this.resources.textureRegistry.registries[TextureRegistry.REGISTRY_TYPE.SPRITE];

    registry.forEach(textureID => textures[textureID].clear());
}

SpriteManager.prototype.exit = function() {
    this.spriteTracker.clear();
    this.pool.forAllReserved((sprite) => {
        sprite.reset();
        sprite.close();
    });
    this.pool.reset();
    this.clear();
    this.sharedSprites.length = 0;

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.initLayers = function(count) {
    for(let i = 0; i < count; i++) {
        this.layers.push([]);
    }
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

SpriteManager.prototype.createSharedSprite = function(spriteID) {
    const sharedSprite = this.getSharedSprite(spriteID);

    if(sharedSprite) {
        return sharedSprite;
    }

    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    const graphID = sprite.getID();
    const spriteIndex = sprite.getIndex();

    this.spriteTracker.add(graphID);
    this.addSharedEntry(spriteID, spriteIndex);
    this.updateSprite(spriteIndex, spriteID);

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

    const graphID = sprite.getID();

    this.spriteTracker.add(graphID);

    return sprite;
}

SpriteManager.prototype.createSprite = function(spriteID, layerID = null, colorID = Texture.DEFAULT_COLOR) {
    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    if(layerID !== null) {
        this.addToLayer(sprite, layerID);
    }

    const graphID = sprite.getID();
    const index = sprite.getIndex();

    this.spriteTracker.add(graphID);
    this.updateSprite(index, spriteID, colorID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
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
        return;
    }

    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
        return;
    }

    this.removeSpriteFromLayers(spriteIndex);
    this.addToLayer(sprite, layerIndex);
}

SpriteManager.prototype.addToLayer = function(sprite, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return;
    }

    const layer = this.layers[layerIndex];
    const index = layer.findIndex(member => member.index === sprite.index);

    if(index !== -1) {
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

SpriteManager.prototype.updateSprite = function(spriteIndex, spriteID, colorID = Texture.DEFAULT_COLOR) {
    //TODO(neyn): Replace with numbers.
    if(typeof spriteID !== "number") {
        spriteID = this.getSpriteID(spriteID);
    }

    if(spriteID < 0 || spriteID >= this.containers.length) {
        return;
    }

    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
        return;
    }

    const container = this.containers[spriteID];
    const { texture, frameCount } = container;

    if(frameCount > 0) {
        sprite.init(container, this.timestamp, spriteID);
        sprite.setColor(colorID);

        //Lazy-Load the default resource.
        if(colorID === Texture.DEFAULT_COLOR) {
            this.resources.loadTexture(texture.id);
        }
    } else {
        sprite.reset();
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
        const { id, index } = this.sharedSprites[i];

        this.destroySprite(index);
    }

    this.sharedSprites.length = 0;
}

SpriteManager.prototype.sortLayer = function(index) {
    const layer = this.getLayer(index);

    layer.sort((current, next) => current.positionY - next.positionY);
}