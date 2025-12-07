import { parseInterface } from "./parser.js";
import { UserInterface } from "./userInterface.js";

export const UIManager = function(resourceLoader) {
    this.resources = resourceLoader;
    this.textureMap = {};
    this.rawInterfaces = {};
    this.interfaces = [];
}

UIManager.prototype.getIconTexture = function(iconID) {
    const textureID = this.textureMap[iconID];

    if(textureID) {
        this.resources.loadTexture(textureID);
    }

    return this.resources.getTextureByID(textureID);
}

UIManager.prototype.load = function(interfaceTypes, iconTypes) {
    if(!interfaceTypes || !iconTypes) {
        return;
    }

    this.rawInterfaces = interfaceTypes;
    this.textureMap = this.resources.createTextures(iconTypes);
}

UIManager.prototype.debug = function(display) {
    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        this.interfaces[i].debug(display, 0, 0);
    }
}

UIManager.prototype.draw = function(display, realTime, deltaTime) {
    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        const element = this.interfaces[i];

        if(element.isVisible()) {
            element.update(realTime, deltaTime);
            element.draw(display, 0, 0);
        }
    }
}

UIManager.prototype.update = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;

    for(let i = this.interfaces.length - 1; i >= 0; i--) {
        const collisions = this.interfaces[i].updateCollisions(positionX, positionY, radius);

        if(collisions > 0) {
            break;
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
        const collisions = this.interfaces[i].onClick(event);

        if(collisions > 0) {
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

UIManager.prototype.parseInterface = function(gameContext, typeID) {
    const element = new UserInterface();
    const type = this.rawInterfaces[typeID];

    if(type !== undefined) {
        parseInterface(gameContext, element, type);
    }

    this.addInterface(element);

    return element;
}

UIManager.prototype.parseInterfaceCustom = function(gameContext, element, typeID) {
    const type = this.rawInterfaces[typeID];

    if(type !== undefined) {
        parseInterface(gameContext, element, type);
    }

    this.addInterface(element);
}