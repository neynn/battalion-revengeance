import { Cursor } from "../../client/cursor.js";
import { MapEditor } from "./mapEditor.js";
import { clampValue, loopValue } from "../../math/math.js";
import { SHAPE } from "../../math/constants.js";
import { Brush } from "./brush.js";
import { ButtonHandler } from "./buttonHandler.js";
import { PalletButton } from "./palletButton.js";
import { Pallet } from "./pallet.js";
import { ColorHelper } from "../../graphics/colorHelper.js";
import { Container } from "../../ui/elements/container.js";
import { ContextHelper } from "../../camera/contextHelper.js";

export const EditorController = function(mapEditor) {
    this.editor = mapEditor;
    this.mapID = null;
    this.guiID = -1;
    this.interfaceID = null;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.slotButtonSize = 50;
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
    this.defaultMap = {};
    this.buttonHandler = new ButtonHandler();
    this.palletButtons = [];
    this.pageIndex = 0;
}

EditorController.prototype.paint = function(gameContext) {
    const button = this.buttonHandler.getActiveButton();

    if(button) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getMap(this.mapID);

        if(worldMap) {
            const { layerID } = button;
            const position = ContextHelper.getMouseTile(gameContext);

            this.editor.onPaint(gameContext, worldMap, position, layerID);
        }
    }
}

EditorController.prototype.destroy = function(gameContext) {
    const { renderer, uiManager } = gameContext;

    uiManager.destroyGUI(this.guiID);
    renderer.destroyContext("CAMERA_CONTEXT");
}

EditorController.prototype.init = function(config, brushSets) {
    const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        slotSize = this.slotButtonSize,
        defaultMap = this.defaultMap,
        textColorView = this.textColorView,
        textColorEdit = this.textColorEdit,
        textColorHide = this.textColorHide,
        brushSizes = [0],
        hiddenSets = [],
        interfaceID = null
    } = config;

    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.interfaceID = interfaceID;
    this.slotButtonSize = slotSize;
    this.defaultMap = defaultMap;
    this.textColorView = textColorView;
    this.textColorEdit = textColorEdit;
    this.textColorHide = textColorHide;

    this.editor.brushSizes.setValues(brushSizes);
    this.editor.initBrushSets(brushSets, hiddenSets);
}

EditorController.prototype.initUI = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.parseGUI(gameContext, this.interfaceID);

    this.guiID = editorInterface.getID();

    ["CONTAINER_FILE", "CONTAINER_LAYERS", "CONTAINER_TILES", "CONTAINER_TOOLS"].forEach(id => {
        const container = editorInterface.getElement(id);

        container.drawFlags |= Container.DRAW_FLAG.BACKGROUND;
        container.backgroundColor = ColorHelper.getRGBAString(20, 20, 20, 128);
    });
}

EditorController.prototype.initPalletButtons = function(gameContext, camera) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);
    const container = editorInterface.getElement("CONTAINER_TILES");

    if(container) {
        const SLOT_START_Y = 100;
        const BUTTON_ROWS = 7;
        const BUTTON_COLUMNS = 7;

        this.palletButtons.length = 0;

        for(let i = 0; i < BUTTON_ROWS; i++) {
            for(let j = 0; j < BUTTON_COLUMNS; j++) {
                const buttonID = `BUTTON_${i * BUTTON_COLUMNS + j}`;
                const button = new PalletButton(this.palletButtons.length, buttonID);
                const posX = this.slotButtonSize * j;
                const posY = this.slotButtonSize * i + SLOT_START_Y;

                button.setShape(SHAPE.RECTANGLE);
                button.setSize(this.slotButtonSize, this.slotButtonSize);
                button.setPosition(posX, posY);
                button.setOrigin(posX, posY);

                if(editorInterface.addElement(button)) {
                    container.addChild(button);

                    this.palletButtons.push(button);
                    this.initPalletButtonEvents(gameContext, button, camera, editorInterface);
                }
            }
        }
    }
}

EditorController.prototype.initPalletButtonEvents = function(gameContext, button, camera, gui) {
    const { tileManager } = gameContext;
    const { palletID } = button;

    button.setClick((event) => {
        const palletIndex = this.getPalletIndex(palletID);
        const tileID = this.editor.pallet.getID(palletIndex);

        if(tileID !== Pallet.ID.ERROR) {
            this.resetBrush(gui);
            this.editor.selectBrush(palletIndex);
        } else {
            this.resetBrush(gui);
        }
    });

    button.setCustom((display, localX, localY) => {
        const palletIndex = this.getPalletIndex(palletID);
        const tileID = this.editor.pallet.getID(palletIndex);

        if(tileID !== Pallet.ID.ERROR) {
            camera.setRelativeScale(this.slotButtonSize, this.slotButtonSize); 
            camera.drawTileSafe(tileManager, tileID, display.context, localX, localY);
            camera.resetScale();
        }
    });
}

EditorController.prototype.resetPage = function() {
    this.pageIndex = 0;
}

EditorController.prototype.updatePage = function(gameContext, delta) {
    const maxPagesNeeded = Math.ceil(this.editor.pallet.getSize() / this.palletButtons.length);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }

    this.updateMenuText(gameContext);
}

EditorController.prototype.updateBrushSize = function(gameContext, delta) {
    this.editor.scrollBrushSize(delta);
    this.updateMenuText(gameContext);
}

EditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => {
        switch(direction) {
            case Cursor.SCROLL.UP: {
                this.updateBrushSize(gameContext, 1);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.updateBrushSize(gameContext, -1);
                break;
            }
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.paint(gameContext);
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.paint(gameContext);
        }
    });
}

EditorController.prototype.clickLayerButton = function(gameContext, buttonID) {
    const { world, uiManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const editorInterface = uiManager.getGUI(this.guiID);

    this.buttonHandler.onClick(editorInterface, this, buttonID);
    this.buttonHandler.updateLayers(worldMap);
}

EditorController.prototype.viewAllLayers = function(gameContext) {
    const { uiManager, world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const editorInterface = uiManager.getGUI(this.guiID);
    
    this.resetBrush(editorInterface);
    this.buttonHandler.resetButtons(editorInterface, this);
    this.buttonHandler.updateLayers(worldMap);
}

EditorController.prototype.resetBrush = function(editorInterface) {
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;

    style.setColorArray(this.textColorView);

    this.editor.resetBrush();
}

EditorController.prototype.updateInversionText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);
    const text = editorInterface.getElement("TEXT_INVERT");
    const { style } = text;

    switch(stateID) {
        case MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED: {
            style.setColorArray(this.textColorEdit);
            break;
        }
        default: {
            style.setColorArray(this.textColorView);
            break;
        }
    }
}

EditorController.prototype.updateEraserText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);
    const text = editorInterface.getElement("TEXT_ERASER");
    const { style } = text;

    switch(stateID) {
        case Brush.MODE.ERASE: {
            style.setColorArray(this.textColorEdit);
            break;
        }
        default: {
            style.setColorArray(this.textColorView);
            break;
        }
    }
}

EditorController.prototype.updateAutoText = function(gameContext, stateID) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);
    const text = editorInterface.getElement("TEXT_AUTO");
    const { style } = text;

    switch(stateID) {
        case MapEditor.AUTOTILER_STATE.INACTIVE: {
            style.setColorArray(this.textColorView);
            this.updateInversionText(gameContext, stateID);
            break;
        }
        case MapEditor.AUTOTILER_STATE.ACTIVE: {
            style.setColorArray(this.textColorEdit);
            break;
        }
    }
}

EditorController.prototype.toggleEraser = function(gameContext) {
    const nextState = this.editor.toggleEraser();

    this.updateEraserText(gameContext, nextState);
}

EditorController.prototype.toggleAutotiler = function(gameContext) {
    const nextState = this.editor.toggleAutotiling();

    this.updateAutoText(gameContext, nextState);
}

EditorController.prototype.toggleInversion = function(gameContext) {
    const inversionState = this.editor.toggleInversion();

    this.updateInversionText(gameContext, inversionState);
}

EditorController.prototype.getPalletIndex = function(index) {
    return this.pageIndex * this.palletButtons.length + index;
} 

EditorController.prototype.resizeCurrentMap = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const gameMap = mapManager.getMap(this.mapID);

    if(!gameMap) {
        console.warn(`GameMap cannot be undefined! Returning...`);
        return;
    }

    const parsedWidth = parseInt(prompt("MAP_WIDTH"));
    const parsedHeight = parseInt(prompt("MAP_HEIGHT"));
    const newWidth = clampValue(parsedWidth, this.maxWidth, 1);
    const newHeight = clampValue(parsedHeight, this.maxHeight, 1);

    gameMap.resize(newWidth, newHeight);
    renderer.onMapSizeUpdate(newWidth, newHeight);
}

EditorController.prototype.updateMenuText = function(gameContext) {
    const { uiManager } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);

    editorInterface.getElement("TEXT_TILESET_MODE").setText(`MODE: ${MapEditor.MODE_NAME[this.editor.modes.getValue()]}`);

    switch(this.editor.modes.getValue()) {
        case MapEditor.MODE.DRAW: {
            editorInterface.getElement("TEXT_TILESET").setText(`${this.editor.brushSets.getValue()?.id}`);
            break;
        }
        case MapEditor.MODE.AUTOTILE: {
            editorInterface.getElement("TEXT_TILESET").setText(`NOT IMPLEMENTED!`);
            break;
        }
    }

    editorInterface.getElement("TEXT_PAGE").setText(this.getPageText());
    editorInterface.getElement("TEXT_SIZE").setText( this.getSizeText());
}

EditorController.prototype.getPageText = function() {
    const maxPagesNeeded = Math.ceil(this.editor.pallet.getSize() / this.palletButtons.length);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

EditorController.prototype.getSizeText = function() {
    const info = this.editor.brushSizes.getInfo();
    const areaString = this.editor.brush.getAreaString();

    return `SIZE: ${areaString} (${info})`;
}