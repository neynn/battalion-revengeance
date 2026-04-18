import { TextureRegistry } from "../resources/texture/textureRegistry.js";

export const UIManager = function() {
    this.layouts = {};
    this.contexts = [];
}

UIManager.prototype.load = function(textureLoader, layouts, textures) {
    if(layouts) {
        this.layouts = layouts;
    }

    if(textures) {
        textureLoader.createGUITextures(textures);
    }
}

UIManager.prototype.debug = function(display) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].debug(display, 0, 0);
    }
}

UIManager.prototype.update = function(gameContext) {
    const { client, timer } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;
    const { deltaTime, realTime } = timer;
    let isCollided = false;

    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];

        if(context.isVisible()) {
            if(!isCollided) {
                isCollided = context.updateCollisions(positionX, positionY, radius);
            }

            context.update(realTime, deltaTime);
        }
    }
}

UIManager.prototype.draw = function(gameContext, display) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];

        context.draw(display, 0, 0);

        if(context.doImmediate && context.isVisible()) {
            context.hotWidget = -1;
            context.onImmediate(gameContext, display);
        }
    }
}

UIManager.prototype.exit = function() {
    this.contexts.length = 0;
}

UIManager.prototype.destroyContext = function(id) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        if(context.id === id) {
            context.clear();
            this.contexts.splice(i, 1);
            break;
        }
    }
}

UIManager.prototype.getContextByID = function(id) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        if(context.id === id) {
            return context;
        }
    }

    return null;
}

UIManager.prototype.onClick = function(event) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const { previousHot, clickCallbacks } = this.contexts[i];

        if(previousHot !== null) {
            const elementID = previousHot.getID();
            const callback = clickCallbacks.get(elementID);

            if(callback) {
                callback(event);
            }

            break;
        }
    }
}

UIManager.prototype.onWindowResize = function(windowWidth, windowHeight) {
    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].onWindowResize(windowWidth, windowHeight);
    }
}

UIManager.prototype.addContext = function(context) {
    const contextID = context.getID();

    for(let i = 0; i < this.contexts.length; i++) {
        if(this.contexts[i].id === contextID) {
            return;
        }
    }

    this.contexts.push(context);
}

UIManager.prototype.getLayout = function(typeID) {
    const type = this.layouts[typeID];

    if(type === undefined) {
        return null;
    }

    return type;
}