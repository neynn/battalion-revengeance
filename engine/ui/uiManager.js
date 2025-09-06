import { Logger } from "../logger.js";
import { UIParser } from "./parser.js";
import { UserInterface } from "./userInterface.js";

export const UIManager = function(resourceLoader) {
    this.nextID = 0;
    this.resources = resourceLoader;
    this.textureMap = {};
    this.parser = new UIParser();
    this.interfaceStack = [];
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
        Logger.log(Logger.CODE.ENGINE_ERROR, "InterfaceTypes/IconTypes cannot be undefined!", "UIManager.prototype.load", null);
    }

    this.parser.load(interfaceTypes);
    this.textureMap = this.resources.createTextures(iconTypes);
}

UIManager.prototype.debug = function(display) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].debug(display);
    }
}

UIManager.prototype.draw = function(display, realTime, deltaTime) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].draw(display, realTime, deltaTime);
    }
}

UIManager.prototype.update = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;

    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].updateCollisions(positionX, positionY, radius);

        if(this.interfaceStack[i].isAnyColliding()) {
            break;
        }
    }
}

UIManager.prototype.getIndex = function(interfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const currentID = this.interfaceStack[i].getID();

        if(currentID === interfaceID) {
            return i;
        }
    }

    return -1;
}

UIManager.prototype.exit = function() {
    this.nextID = 0;
    this.interfaceStack.length = 0;
}

UIManager.prototype.getGUI = function(interfaceID) {
    const interfaceIndex = this.getIndex(interfaceID);

    if(interfaceIndex === -1) {
        return null;
    }

    return this.interfaceStack[interfaceIndex];
}

UIManager.prototype.onClick = function(mouseX, mouseY, mouseRange) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = this.interfaceStack[i];
        const isAnyColliding = userInterface.isAnyColliding();

        if(isAnyColliding) {
            userInterface.handleClick(mouseX, mouseY, mouseRange);
            break;
        }
    }
}

UIManager.prototype.onWindowResize = function(windowWidth, windowHeight) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        this.interfaceStack[i].updateRootAnchors(windowWidth, windowHeight);
    }
}

UIManager.prototype.destroyGUI = function(interfaceID) {
    const index = this.getIndex(interfaceID);

    if(index === -1) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "GUI does not exist!", "UIManager.prototype.destroyGUI", { "interfaceID": interfaceID });
        return;
    }

    const userInterface = this.interfaceStack[index];

    userInterface.clear();

    this.interfaceStack.splice(index, 1);
}

UIManager.prototype.createGUI = function() {
    const interfaceID = this.nextID++;
    const userInterface = new UserInterface(interfaceID);

    this.interfaceStack.push(userInterface);

    return userInterface;
}

UIManager.prototype.parseGUI = function(gameContext, typeID) {
    const { renderer } = gameContext;
    const { windowWidth, windowHeight } = renderer;
    const gui = this.createGUI();

    this.parser.initGUI(gameContext, typeID, gui);

    gui.refreshRoots();
    gui.updateRootAnchors(windowWidth, windowHeight);

    return gui;
}