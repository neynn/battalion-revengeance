import { TextStyle } from "../graphics/textStyle.js";
import { SHAPE } from "../math/constants.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { Scrollbar } from "./elements/scrollbar.js";
import { TextElement } from "./elements/textElement.js";

export const UIParser = function() {
    this.interfaceTypes = {};
}

UIParser.ELEMENT_TYPE = {
    NONE: 0,
    TEXT: 1,
    BUTTON: 2,
    ICON: 3,
    CONTAINER: 4,
    SCROLLBAR: 5
};

UIParser.ELEMENT_TYPE_MAP = {
    "BUTTON": UIParser.ELEMENT_TYPE.BUTTON,
    "TEXT": UIParser.ELEMENT_TYPE.TEXT,
    "ICON": UIParser.ELEMENT_TYPE.ICON,
    "CONTAINER": UIParser.ELEMENT_TYPE.CONTAINER,
    "SCROLLBAR": UIParser.ELEMENT_TYPE.SCROLLBAR
};

UIParser.prototype.load = function(interfaceTypes) {
    this.interfaceTypes = interfaceTypes;
}

UIParser.prototype.parseTypeID = function(typeName) {
    const typeID = UIParser.ELEMENT_TYPE_MAP[typeName];

    if(typeID === undefined) {
        return typeName;
    }

    return typeID;
}

UIParser.prototype.createElementFromConfig = function(uiManager, config, DEBUG_NAME) {
    const {
        type,
        position = { x: 0, y: 0 },
        width = 0,
        height = 0,
        anchor = "TOP_LEFT",
        opacity = 1
    } = config;

    const { x, y } = position;
    const typeID = this.parseTypeID(type);

    switch(typeID) {
        case UIParser.ELEMENT_TYPE.BUTTON: {
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
        case UIParser.ELEMENT_TYPE.CONTAINER: {
            const element = new Container(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setSize(width, height);

            return element;
        }
        case UIParser.ELEMENT_TYPE.ICON: {
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
        case UIParser.ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
        case UIParser.ELEMENT_TYPE.TEXT: {
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
        default: {
            const element = new Container(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setSize(width, height);

            return element;
        }
    }
}

UIParser.prototype.initGUI = function(gameContext, typeID, gui) {
    const { uiManager, renderer } = gameContext;
    const { effectManager } = renderer;
    const userInterfaceType = this.interfaceTypes[typeID];

    if(!userInterfaceType) {
        return;
    }

    for(const elementID in userInterfaceType) {
        const config = userInterfaceType[elementID];
        const element = this.createElementFromConfig(uiManager, config, elementID);

        gui.addNamedElement(element, elementID);   
    }
    
    for(const elementID in userInterfaceType) {
        const element = gui.getElement(elementID);
        const config = userInterfaceType[elementID];
        const { children, effects } = config;

        if(effects) {
            effectManager.addEffects(element, effects);
        }

        if(children) {
            for(let i = 0; i < children.length; i++) {
                const child = gui.getElement(children[i]);

                if(child) {
                    element.addChild(child);
                }
            }
        }
    }
}