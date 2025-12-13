import { Cursor } from "../../client/cursor.js";
import { clampValue, loopValue } from "../../math/math.js";
import { ButtonHandler } from "./buttonHandler.js";
import { getCursorTile } from "../../camera/contextHelper.js";
import { TileManager } from "../../tile/tileManager.js";

export const EditorController = function(mapEditor, userInterface) {
    this.editor = mapEditor;
    this.userInterface = userInterface;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.buttonHandler = new ButtonHandler();
    this.buttonCount = -1;
    this.pageIndex = 0;
}

EditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => {
        switch(direction) {
            case Cursor.SCROLL.UP: {
                this.updateBrushSize(1);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.updateBrushSize(-1);
                break;
            }
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            this.editor.paint(gameContext, x, y);
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            this.editor.paint(gameContext, x, y);
        }
    });
}

EditorController.prototype.initPalletButtons = function(gameContext, buttons, camera) {
    const { tileManager } = gameContext;
    const slotButtonSize = this.userInterface.slotButtonSize;

    for(const button of buttons) {
        const { palletID } = button;

        button.setClick((event) => {
            const palletIndex = this.getPalletIndex(palletID);
            const tileID = this.editor.getPalletID(palletIndex);

            if(tileID !== TileManager.TILE_ID.INVALID) {
                this.resetBrush();
                this.editor.selectBrush(palletIndex);
            } else {
                this.resetBrush();
            }
        });

        button.setCustom((display, localX, localY) => {
            const palletIndex = this.getPalletIndex(palletID);
            const tileID = this.editor.getPalletID(palletIndex);

            if(tileID !== TileManager.TILE_ID.INVALID) {
                camera.setRelativeScale(slotButtonSize, slotButtonSize); 
                camera.drawTile(tileManager, tileID, display.context, localX, localY);
                camera.resetScale();
            }
        });
    }

    if(buttons.length === 0) {
        this.buttonCount = -1;
    } else {
        this.buttonCount = buttons.length;
    }
}

EditorController.prototype.resetPage = function() {
    this.pageIndex = 0;
}

EditorController.prototype.updatePage = function(delta) {
    const maxPagesNeeded = Math.ceil(this.editor.getPalletSize() / this.buttonCount);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }

    this.updateMenuText();
}

EditorController.prototype.updateBrushSize = function(delta) {
    this.editor.scrollBrushSize(delta);
    this.updateMenuText();
}

EditorController.prototype.clickLayerButton = function(buttonID) {
    const worldMap = this.editor.targetMap;

    if(!worldMap) {
        return;
    }

    this.buttonHandler.onClick(this.userInterface, buttonID);
    this.buttonHandler.updateLayers(worldMap);

    const activeButton = this.buttonHandler.getActiveButton();

    if(activeButton) {
        const { layerID } = activeButton;

        this.editor.setTargetLayer(layerID);
    } else {
        this.editor.removeTargetLayer();
    }
}

EditorController.prototype.viewAllLayers = function() {
    const worldMap = this.editor.targetMap;

    if(!worldMap) {
        return;
    }
    
    this.resetBrush();
    this.buttonHandler.resetButtons(this.userInterface, this);
    this.buttonHandler.updateLayers(worldMap);
    this.editor.removeTargetLayer();
}

EditorController.prototype.resetBrush = function() {
    this.editor.resetBrush();
    this.userInterface.updateEraserText(false);
}

EditorController.prototype.toggleInversion = function() {
    const isInverted = this.editor.toggleInversion();

    this.userInterface.updateInversionText(isInverted);
}

EditorController.prototype.toggleEraser = function() {
    const isErasing = this.editor.toggleEraser();

    this.userInterface.updateEraserText(isErasing);
}

EditorController.prototype.togglePermutation = function() {
    const isEnabled = this.editor.togglePermutation();

    this.userInterface.updatePermutationText(isEnabled);
}

EditorController.prototype.toggleAutotiler = function() {
    const isEnabled = this.editor.toggleAutotiling();

    this.userInterface.updateAutoText(isEnabled);
}

EditorController.prototype.getPalletIndex = function(index) {
    return this.pageIndex * this.buttonCount + index;
} 

EditorController.prototype.resizeCurrentMap = function(gameContext) {
    const { renderer } = gameContext;
    const worldMap = this.editor.targetMap;

    if(!worldMap) {
        console.warn(`GameMap cannot be undefined! Returning...`);
        return;
    }

    const parsedWidth = parseInt(prompt("MAP_WIDTH"));
    const parsedHeight = parseInt(prompt("MAP_HEIGHT"));
    const newWidth = clampValue(parsedWidth, this.maxWidth, 1);
    const newHeight = clampValue(parsedHeight, this.maxHeight, 1);

    worldMap.resize(newWidth, newHeight);
    renderer.onMapSizeUpdate(newWidth, newHeight);
}

EditorController.prototype.getPageText = function() {
    const maxPagesNeeded = Math.ceil(this.editor.getPalletSize() / this.buttonCount);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

EditorController.prototype.getSizeText = function() {
    const info = this.editor.brushSizes.getInfo();
    const areaString = this.editor.getBrushArea();

    return `SIZE: ${areaString} (${info})`;
}

EditorController.prototype.updateMenuText = function() {
    this.userInterface.getElement("TEXT_TILESET_MODE").setText("MODE: " + this.editor.getModeName());
    this.userInterface.getElement("TEXT_PAGE").setText(this.getPageText());
    this.userInterface.getElement("TEXT_SIZE").setText( this.getSizeText());
    this.userInterface.getElement("TEXT_TILESET").setText(this.editor.getPalletName());
}
