import { TextStyle } from "../graphics/textStyle.js";
import { SHAPE } from "../math/constants.js";
import { ANCHOR_TYPE } from "./constants.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { Scrollbar } from "./elements/scrollbar.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

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

const createElement = function(uiManager, config, DEBUG_NAME) {
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
    const anchorID = ANCHOR_TYPE[anchor] ?? ANCHOR_TYPE.TOP_LEFT;

    switch(typeID) {
        case ELEMENT_TYPE.BUTTON: {
            const element = new Button(DEBUG_NAME);
            const { shape = SHAPE.RECTANGLE, radius = width } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchorID);

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
            element.setAnchor(anchorID);

            element.setSize(width, height);

            return element;
        }
        case ELEMENT_TYPE.ICON: {
            const element = new Icon(DEBUG_NAME);
            const {
                image = null,
                scale = 1
            } = config;

            const texture = uiManager.getUITexture(image);
            const { handle } = texture;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchorID);
            element.setSize(width, height);
            element.setHandle(handle);
            element.setScale(scale);

            return element;
        }
        case ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchorID);

            return element;
        }
        case ELEMENT_TYPE.TEXT: {
            const element = new TextElement(DEBUG_NAME);
            const { 
                text = "ERROR",
                fontType = TextStyle.DEFAULT.FONT_TYPE,
                fontSize = TextStyle.DEFAULT.FONT_SIZE,
                align = TextStyle.ALIGN.LEFT,
                color
            } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchorID);

            element.setText(text);
            element.style.setFontType(fontType);
            element.style.setFontSize(fontSize);
            element.style.setAlignment(align);
            element.style.setColorArray(color);

            return element;
        }
    }
}

const createLayout = function(gameContext, uiContext, layout) {
    const { uiManager, gameWindow } = gameContext;
    const windowWidth = gameWindow.width;
    const windowHeight = gameWindow.height;

    for(const elementName in layout) {
        const config = layout[elementName];
        const element = createElement(uiManager, config, elementName);

        uiContext.addElement(element);
        uiContext.registerName(elementName, element);   
    }
    
    for(const elementName in layout) {
        const config = layout[elementName];
        const element = uiContext.getElement(elementName);
        const { children = [], effects = [] } = config;

        //TODO(neyn): Rewrite effects.
        if(effects.length !== 0) {
            const effect = effects[0];
            const effectID = UIElement.EFFECT[effect.type];

            if(effectID !== undefined) {
                element.setEffect(effectID);
            }
        }

        for(const childID of children) {
            const child = uiContext.getElement(childID);

            if(child) {
                element.addChild(child);
            }
        }
    }

    uiContext.refreshRoots();
    uiContext.onWindowResize(windowWidth, windowHeight);
}

export const parseLayout = function(gameContext, uiContext, layoutID) {
    const { uiManager } = gameContext;
    const layout = uiManager.getLayout(layoutID);

    if(layout) {
        createLayout(gameContext, uiContext, layout);
    }

    uiManager.addContext(uiContext);
}