import { Sprite } from "./sprite.js";
import { ObjectPool } from "../util/objectPool.js";
import { SpriteDefinition } from "./spriteDefinition.js";
import { TextureRegistry } from "../resources/texture/textureRegistry.js";
import { Texture } from "../resources/texture/texture.js";

const MAX_SPRITES = 1024;

/**
 * 
 * @param {TextureRegistry} textureRegistry 
 */
export const SpriteManager = function(textureRegistry) {
    this.registry = textureRegistry;
    this.pool = new ObjectPool(MAX_SPRITES, (index) => new Sprite(index, "EMPTY_SPRITE"));
    this.relevantTextures = new Set();
    this.spriteTracker = new Set();
    this.definitionMap = new Map();
    this.definitions = [];
    this.layers = [];
    this.timestamp = 0;
    this.nextCleanup = 0;
}

SpriteManager.INVALID_ID = -1;
SpriteManager.SECONDS_TO_CLEANUP = 5;
SpriteManager.EMPTY_SPRITE = new Sprite(SpriteManager.INVALID_ID, "EMPTY_SPRITE");
SpriteManager.EMPTY_LAYER = [];

SpriteManager.prototype.getSpriteDefinitionID = function(name) {
    const definitionID = this.definitionMap.get(name);

    if(definitionID === undefined) {
        return SpriteManager.INVALID_ID;
    }

    return definitionID;
}

SpriteManager.prototype.getTextureID = function(definitionID) {
    if(definitionID < 0 || definitionID >= this.definitions.length) {
        return TextureRegistry.INVALID_ID;
    }

    return this.definitions[definitionID].texture.id;
}

SpriteManager.prototype.getDefinition = function(definitionID) {
    if(definitionID < 0 || definitionID >= this.definitions.length) {
        return Sprite.EMPTY_DEFINITION;
    }

    return this.definitions[definitionID];
}

SpriteManager.prototype.load = function(textures, sprites) {
    if(!textures || !sprites) {
        return;
    }
    
    this.registry.createTextures(textures);

    for(const spriteID in sprites) {
        const spriteConfig = sprites[spriteID];
        const { texture, shift, anchor, bounds, frameTime, spriteTime, frames, autoFrames } = spriteConfig;
        const textureID = this.registry.getTextureID(texture);

        if(textureID === TextureRegistry.INVALID_ID) {
            console.warn(`Texture ${texture} of sprite ${spriteID} does not exist!`);
            continue;
        }

        const textureObject = this.registry.getTexture(textureID);
        let spriteFrames;
        
        if(autoFrames) {
            const { start = 1, jump = 0, repeat = 0 } = autoFrames;

            spriteFrames = textureObject.getRegionsAuto(start, jump, repeat);
        } else if(frames) {
            spriteFrames = textureObject.getRegionsByNames(frames);
        }

        if(spriteFrames.length === 0) {
            console.warn(`Frames for sprite ${spriteID} could not be fetched!`);
            continue;
        }

        const definitionID = this.definitions.length;
        const definition = new SpriteDefinition(definitionID, textureObject, spriteFrames);

        if(spriteTime !== undefined) {
            definition.setSpriteTime(spriteTime);
        } else if(frameTime !== undefined) {
            definition.setFrameTime(frameTime);
        }

        if(bounds) {
            definition.loadBounds(bounds);
        } else {
            definition.loadDefaultBounds();
        }

        if(anchor) {
            definition.loadAnchor(anchor);
        } else if(shift) {
            definition.loadShift(shift);
        }

        this.definitions.push(definition);
        this.definitionMap.set(spriteID, definitionID);
        this.relevantTextures.add(textureID);
    }
}

SpriteManager.prototype.forEachSprite = function(onCall) {
    if(typeof onCall === "function") {
        this.pool.forAllReserved(onCall);
    }
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    this.timestamp = realTime;

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

SpriteManager.prototype.exit = function() {
    this.spriteTracker.clear();
    this.pool.forAllReserved((sprite) => {
        sprite.reset();
        sprite.close();
    });
    this.pool.reset();

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }

    for(const textureID of this.relevantTextures) {
        this.registry.clearTexture(textureID);
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

SpriteManager.prototype.createEmptySprite = function() {
    const sprite = this.pool.reserveElement();

    if(!sprite) {
        return SpriteManager.EMPTY_SPRITE;
    }

    sprite.reset();

    const graphID = sprite.getID();

    this.spriteTracker.add(graphID);

    return sprite;
}

SpriteManager.prototype.createSprite = function(definitionID, layerID = null, colorID = Texture.DEFAULT_COLOR) {
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
    this.updateSprite(index, definitionID, colorID);

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

SpriteManager.prototype.updateSprite = function(spriteIndex, definitionID, colorID = Texture.DEFAULT_COLOR) {
    if(definitionID < 0 || definitionID >= this.definitions.length) {
        return;
    }

    const sprite = this.pool.getReservedElement(spriteIndex);

    if(!sprite) {
        return;
    }

    const definition = this.definitions[definitionID];
    const { texture, frameCount } = definition;

    if(frameCount > 0) {
        sprite.useDefinition(definition, this.timestamp, definitionID);
        sprite.selectImageVariant(colorID);

        //Lazy-Load the default resource.
        if(colorID === Texture.DEFAULT_COLOR) {
            this.registry.loadTexture(texture.id);
        }
    } else {
        sprite.reset();
    }
}

SpriteManager.prototype.sortLayer = function(index) {
    const layer = this.getLayer(index);

    layer.sort((current, next) => current.positionY - next.positionY);
}