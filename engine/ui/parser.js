import { TextStyle } from "../graphics/textStyle.js";
import { SHAPE } from "../math/constants.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { Scrollbar } from "./elements/scrollbar.js";
import { TextElement } from "./elements/textElement.js";

const ELEMENT_TYPE = {
    NONE: 0,
    TEXT: 1,
    BUTTON: 2,
    ICON: 3,
    CONTAINER: 4,
    SCROLLBAR: 5
};

const getTypeID = function(name) {
    switch(name) {
        case "BUTTON": return ELEMENT_TYPE.BUTTON;
        case "TEXT": return ELEMENT_TYPE.TEXT;
        case "ICON": return ELEMENT_TYPE.ICON;
        case "CONTAINER": return ELEMENT_TYPE.CONTAINER;
        case "SCROLLBAR": return ELEMENT_TYPE.SCROLLBAR;
        default: return ELEMENT_TYPE.CONTAINER;
    }
}

const parseElement = function(uiManager, config, DEBUG_NAME) {
    const {
        type,
        position = { x: 0, y: 0 },
        width = 0,
        height = 0,
        anchor = "TOP_LEFT",
        opacity = 1
    } = config;

    const { x, y } = position;
    const typeID = getTypeID(type);

    switch(typeID) {
        case ELEMENT_TYPE.BUTTON: {
            const element = new Button(DEBUG_NAME);
            const { shape = SHAPE.RECTANGLE, radius = width } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            switch(shape) {
                case SHAPE.RECTANGLE: {
                    element.setSize(width, height);
                    element.setShape(SHAPE.RECTANGLE);
                    break;
                }
                case SHAPE.CIRCLE: {
                    element.setSize(radius, radius);
                    element.setShape(SHAPE.CIRCLE);
                    break;
                }
            }

            return element;
        }
        case ELEMENT_TYPE.CONTAINER: {
            const element = new Container(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setSize(width, height);

            return element;
        }
        case ELEMENT_TYPE.ICON: {
            const element = new Icon(DEBUG_NAME);
            const {
                image = null,
                scaleX = 1,
                scaleY = 1
            } = config;

            const texture = uiManager.getIconTexture(image);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);
            element.setSize(width, height);
            element.setTexture(texture);
            element.setScale(scaleX, scaleY);

            return element;
        }
        case ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
        case ELEMENT_TYPE.TEXT: {
            const element = new TextElement(DEBUG_NAME);
            const { 
                text = "ERROR",
                fontType = TextStyle.DEFAULT.FONT_TYPE,
                fontSize = TextStyle.DEFAULT.FONT_SIZE,
                align = TextStyle.TEXT_ALIGNMENT.LEFT,
                color
            } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setText(text);
            element.style.setFontType(fontType);
            element.style.setFontSize(fontSize);
            element.style.setAlignment(align);
            element.style.setColorArray(color);

            return element;
        }
    }
}

const parseInterface = function(gameContext, userInterface, rawInterface) {
    const { uiManager, renderer } = gameContext;
    const { effectManager, windowWidth, windowHeight } = renderer;

    for(const elementID in rawInterface) {
        const config = rawInterface[elementID];
        const element = parseElement(uiManager, config, elementID);

        userInterface.addNamedElement(element, elementID);   
    }
    
    for(const elementID in rawInterface) {
        const config = rawInterface[elementID];
        const element = userInterface.getElement(elementID);
        const { children = [], effects } = config;

        if(effects) {
            effectManager.addEffects(element, effects);
        }

        for(const childID of children) {
            const child = userInterface.getElement(childID);

            if(child) {
                element.addChild(child);
            }
        }
    }

    userInterface.refreshRoots();
    userInterface.onWindowResize(windowWidth, windowHeight);
}

export const parseInterfaceByID = function(gameContext, userInterface, interfaceID) {
    const { uiManager } = gameContext;
    const config = uiManager.getInterfaceType(interfaceID);

    parseInterface(gameContext, userInterface, config);

    uiManager.addInterface(userInterface);
}