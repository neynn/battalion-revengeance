export const UIManager = function(textureLoader) {
    this.textureLoader = textureLoader;
    this.textureMap = {};
    this.rawInterfaces = {};
    this.interfaces = [];
}

UIManager.prototype.getIconTexture = function(iconID) {
    const textureID = this.textureMap[iconID];

    if(textureID) {
        this.textureLoader.loadTexture(textureID);
    }

    return this.textureLoader.getTexture(textureID);
}

UIManager.prototype.load = function(interfaceTypes, iconTypes) {
    if(interfaceTypes) {
        this.rawInterfaces = interfaceTypes;
    }

    if(iconTypes) {
        this.textureMap = this.textureLoader.createTextures(iconTypes);
    }
}

UIManager.prototype.debug = function(display) {
    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        this.interfaces[i].debug(display, 0, 0);
    }
}

UIManager.prototype.update = function(gameContext, display) {
    const { client, timer } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;
    const { deltaTime, realTime } = timer;
    let isCollided = false;

    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        const context = this.interfaces[i];

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
    this.interfaces.length = 0;
}

UIManager.prototype.destroyInterface = function(id) {
    for(let i = 0; i < this.interfaces.length; i++) {
        const element = this.interfaces[i];

        if(element.id === id) {
            element.clear();
            this.interfaces.splice(i, 1);
            break;
        }
    }
}

UIManager.prototype.getInterfaceByID = function(id) {
    for(let i = 0; i < this.interfaces.length; i++) {
        const element = this.interfaces[i];

        if(element.id === id) {
            return element;
        }
    }

    return null;
}

UIManager.prototype.handleClick = function(event) {
    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        const { previousHot } = this.interfaces[i];

        if(previousHot !== null) {
            previousHot.onClick(event);
            break;
        }
    }
}

UIManager.prototype.onWindowResize = function(windowWidth, windowHeight) {
    for(let i = 0; i < this.interfaces.length; i++) {
        this.interfaces[i].onWindowResize(windowWidth, windowHeight);
    }
}

UIManager.prototype.addInterface = function(element) {
    const interfaceID = element.getID();

    for(let i = 0; i < this.interfaces.length; i++) {
        if(this.interfaces[i].id === interfaceID) {
            return;
        }
    }

    this.interfaces.push(element);
}

UIManager.prototype.getInterfaceType = function(typeID) {
    const type = this.rawInterfaces[typeID];

    if(type === undefined) {
        return null;
    }

    return type;
}