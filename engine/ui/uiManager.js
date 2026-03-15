export const UIManager = function(textureLoader) {
    this.textureLoader = textureLoader;
    this.textureMap = {};
    this.layouts = {};
    this.contexts = [];
}

UIManager.prototype.getIconTexture = function(iconID) {
    const textureID = this.textureMap[iconID];

    if(textureID) {
        this.textureLoader.loadTexture(textureID);
    }

    return this.textureLoader.getTexture(textureID);
}

UIManager.prototype.load = function(layouts, iconTypes) {
    if(layouts) {
        this.layouts = layouts;
    }

    if(iconTypes) {
        this.textureMap = this.textureLoader.createTextures(iconTypes);
    }
}

UIManager.prototype.debug = function(display) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].debug(display, 0, 0);
    }
}

UIManager.prototype.update = function(gameContext, display) {
    const { client, timer } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;
    const { deltaTime, realTime } = timer;
    let isCollided = false;

    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];

        if(context.isRetained) {
            if(context.isVisible()) {
                if(!isCollided) {
                    isCollided = context.updateCollisions(positionX, positionY, radius);
                }

                context.update(realTime, deltaTime);
                context.draw(display, 0, 0);
            }
        } else {
            context.updateCursor(cursor);
            context.update(gameContext, display);
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

UIManager.prototype.handleClick = function(event) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const { previousHot } = this.contexts[i];

        if(previousHot !== null) {
            previousHot.onClick(event);
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