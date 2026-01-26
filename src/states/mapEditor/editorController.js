import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../../battalionContext.js";
import { ClientMapFactory } from "../../systems/map.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { clampValue, loopValue } from "../../../engine/math/math.js";
import { ButtonHandler } from "../../../engine/map/editor/buttonHandler.js";
import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Cursor } from "../../../engine/client/cursor.js";
import { TILE_WIDTH } from "../../constants.js";

export const EditorController = function(mapEditor, userInterface, camera2D) {
    this.editor = mapEditor;
    this.userInterface = userInterface;
    this.camera2D = camera2D;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.buttonHandler = new ButtonHandler();
    this.buttonCount = -1;
    this.pageIndex = 0;
    this.defaultWidth = 20;
    this.defaultHeight = 20;

    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L1, BattalionMap.LAYER.GROUND, "TEXT_L1");
    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L2, BattalionMap.LAYER.DECORATION, "TEXT_L2");
    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L3, BattalionMap.LAYER.CLOUD, "TEXT_L3"); 
}

EditorController.LAYER_BUTTON = {
    L1: "L1",
    L2: "L2",
    L3: "L3"
};

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
                const scale = slotButtonSize / TILE_WIDTH;

                camera.drawTile(tileManager, tileID, display.context, localX, localY, scale);
            }
        });
    }

    if(buttons.length === 0) {
        this.buttonCount = -1;
    } else {
        this.buttonCount = buttons.length;
    }
}

EditorController.prototype.updatePage = function(gameContext, delta) {
    const maxPagesNeeded = Math.ceil(this.editor.getPalletSize() / this.buttonCount);

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

    this.editor.autofillMap();
    this.camera2D.jumpToTile(0, 0);
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

EditorController.prototype.updateMenuText = function(gameContext) {
    const { language } = gameContext;
    const tilesetName = language.getSystemTranslation(this.editor.getPalletName());

    this.userInterface.getElement("TEXT_TILESET_MODE").setText("MODE: " + this.editor.getModeName());
    this.userInterface.getElement("TEXT_PAGE").setText(this.getPageText());
    this.userInterface.getElement("TEXT_SIZE").setText( this.getSizeText());
    this.userInterface.getElement("TEXT_TILESET").setText(tilesetName);
}

EditorController.prototype.saveMap = function() {
    const worldMap = this.editor.targetMap;
    
    if(!worldMap) {
        return new PrettyJSON(4)
        .open()
        .writeLine("ERROR", "MAP NOT LOADED! USE CREATE OR LOAD!")
        .close()
        .download("map_" + worldMap.getID());
    }

    const layers = worldMap.saveLayers();
    const flags = worldMap.saveFlags();

    new PrettyJSON(4)
    .open()
    .writeLine("music", worldMap.music)
    .writeLine("width", worldMap.width)
    .writeLine("height", worldMap.height)
    .writeLine("teams", {})
    .writeLine("entities", [])
    .writeLine("objectives", {})
    .writeLine("prelogue", [])
    .writeLine("postlogue", [])
    .writeLine("defeat", [])
    .writeLine("localization", [])
    .writeLine("events", {})
    .writeLine("flags", flags)
    .writeList("data", layers)
    .close()
    .download("map_" + worldMap.getID());
}

EditorController.prototype.createMap = function(gameContext) {
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const worldMap = ClientMapFactory.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        if(worldMap) {
            this.editor.setTargetMap(worldMap);
            this.editor.autofillMap();
        }
    }
}

EditorController.prototype.loadMap = async function(gameContext) {
    const { language } = gameContext;
    const mapID = prompt(language.getSystemTranslation("EDITOR_LOAD_MAP"));
    const worldMap = await ClientMapFactory.createEditorMap(gameContext, mapID);

    if(worldMap) {
        this.editor.setTargetMap(worldMap);
    }
}

EditorController.prototype.initCommands = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;

    router.bind(gameContext, "EDIT");
    router.on("TOGGLE_AUTOTILER", () => this.toggleAutotiler());
    router.on("TOGGLE_ERASER", () => this.toggleEraser());
    router.on("TOGGLE_INVERSION", () => this.toggleInversion());
    router.on("TOGGLE_RANDOM", () => this.togglePermutation());
}

EditorController.prototype.initUIEvents = function(gameContext) {
    const { states } = gameContext;

    this.userInterface.getElement("BUTTON_INVERT").setClick(() => this.toggleInversion());
    this.userInterface.getElement("BUTTON_BACK").setClick(() => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    this.userInterface.getElement("BUTTON_AUTO").setClick(() => this.toggleAutotiler());

    this.userInterface.getElement("BUTTON_TILESET_MODE").setClick(() => {
        this.editor.scrollMode(1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.getElement("BUTTON_TILESET_LEFT").setClick(() => {
        this.editor.scrollBrushSet(-1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.getElement("BUTTON_TILESET_RIGHT").setClick(() => {
        this.editor.scrollBrushSet(1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.getElement("BUTTON_PERMUTATION").setClick(() => this.togglePermutation());
    this.userInterface.getElement("BUTTON_PAGE_LAST").setClick(() => this.updatePage(gameContext, -1)); 
    this.userInterface.getElement("BUTTON_PAGE_NEXT").setClick(() => this.updatePage(gameContext, 1));  
    this.userInterface.getElement("BUTTON_SCROLL_SIZE").setClick(() => this.updateBrushSize(gameContext, 1));
    this.userInterface.getElement("BUTTON_SAVE").setClick(() => this.saveMap());
    this.userInterface.getElement("BUTTON_CREATE").setClick(() => this.createMap(gameContext));
    this.userInterface.getElement("BUTTON_LOAD").setClick(() => this.loadMap(gameContext));
    this.userInterface.getElement("BUTTON_RESIZE").setClick(() => this.resizeCurrentMap(gameContext)); 
    this.userInterface.getElement("BUTTON_UNDO").setClick(() => this.editor.undo(gameContext)); 
    this.userInterface.getElement("BUTTON_ERASER").setClick(() => this.toggleEraser());
    this.userInterface.getElement("BUTTON_VIEW_ALL").setClick(() => this.viewAllLayers());

    this.userInterface.getElement("BUTTON_L1").setClick(() => this.clickLayerButton(EditorController.LAYER_BUTTON.L1));
    this.userInterface.getElement("BUTTON_L2").setClick(() => this.clickLayerButton(EditorController.LAYER_BUTTON.L2));
    this.userInterface.getElement("BUTTON_L3").setClick(() => this.clickLayerButton(EditorController.LAYER_BUTTON.L3));
}