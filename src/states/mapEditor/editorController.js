import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../../battalionContext.js";
import { createEditorMap, createEmptyMap } from "../../systems/map.js";
import { BattalionMap } from "../../map/battalionMap.js";
import { clampValue, loopValue } from "../../../engine/math/math.js";
import { ButtonHandler } from "../../../engine/map/editor/buttonHandler.js";
import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";
import { BrushSet } from "../../../engine/map/editor/brushSet.js";
import { ENTITY_TYPE, TILE_ID } from "../../enums.js";
import { BUTTON_COUNT } from "./mapEditorInterface.js";
import { TileManager } from "../../../engine/tile/tileManager.js";
import { Scroller } from "../../../engine/util/scroller.js";

const createBrushSize = function() {
    return {
        "width": 0,
        "height": 0
    }
}

const fillBrushSize = function(width, height) {
    const size = createBrushSize();

    size.width = width;
    size.height = height;

    return size;
}

export const EditorController = function(mapEditor) {
    this.editor = mapEditor;
    this.userInterface = null;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.buttonHandler = new ButtonHandler();
    this.pageIndex = 0;
    this.defaultWidth = 20;
    this.defaultHeight = 20;

    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L1, BattalionMap.LAYER.GROUND, "TEXT_L1");
    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L2, BattalionMap.LAYER.DECORATION, "TEXT_L2");
    this.buttonHandler.createButton(EditorController.LAYER_BUTTON.L3, BattalionMap.LAYER.CLOUD, "TEXT_L3");


    this.mode = EditorController.MODE.TILE;
    this.brushSizes = new Scroller(createBrushSize());
    this.tileSets = new Scroller(new BrushSet("INVALID", TileManager.TILE_ID.INVALID));
    this.entitySets = new Scroller(new BrushSet("INVALID", ENTITY_TYPE._INVALID));
    this.initScrollers();
}

EditorController.MODE = {
    TILE: 0,
    ENTITY: 1
};

EditorController.LAYER_BUTTON = {
    L1: "L1",
    L2: "L2",
    L3: "L3"
};

EditorController.prototype.initScrollers = function() {
    const allSet = new BrushSet("MAP_EDITOR_SET_NAME_ALL", TileManager.TILE_ID.INVALID);
    const canyonSet = new BrushSet("MAP_EDITOR_SET_NAME_CANYON", TileManager.TILE_ID.INVALID);
    const roadSet = new BrushSet("MAP_EDITOR_SET_NAME_ROAD", TileManager.TILE_ID.INVALID);
    const groundSet = new BrushSet("MAP_EDITOR_SET_NAME_GROUND", TileManager.TILE_ID.INVALID);
    const shoreSet = new BrushSet("MAP_EDITOR_SET_NAME_SHORE", TileManager.TILE_ID.INVALID);
    const riverSet = new BrushSet("MAP_EDITOR_SET_NAME_RIVER", TileManager.TILE_ID.INVALID);
    const seaSet = new BrushSet("MAP_EDITOR_SET_NAME_SEA", TileManager.TILE_ID.INVALID);
    const railSet = new BrushSet("MAP_EDITOR_SET_NAME_RAIL", TileManager.TILE_ID.INVALID);

    for(let i = TILE_ID.GRASS; i < TILE_ID._COUNT; i++) {
        allSet.addValue(i);
    }

    for(let i = TILE_ID.CANYON_0; i <= TILE_ID.CANYON_47; i++) {
        canyonSet.addValue(i);
    }

    groundSet.values = [
        TILE_ID.VOLANO,
        TILE_ID.ORE_LEFT,
        TILE_ID.ORE_LEFT_USED,
        TILE_ID.ORE_LEFT_DEPLETED,
        TILE_ID.ORE_RIGHT,
        TILE_ID.ORE_RIGHT_USED,
        TILE_ID.ORE_RIGHT_DEPLETED
    ];

    for(let i = TILE_ID.SHORE_0; i <= TILE_ID.SHORE_11; i++) {
        shoreSet.addValue(i);
    }

    for(let i = TILE_ID.ROAD_0; i <= TILE_ID.ROAD_15; i++) {
        roadSet.addValue(i);
    }

    for(let i = TILE_ID.RIVER_0; i <= TILE_ID.RIVER_47; i++) {
        riverSet.addValue(i);
    }

    for(let i = TILE_ID.ISLAND_1; i <= TILE_ID.ROCKS_4; i++) {
        seaSet.addValue(i);
    }

    for(let i = TILE_ID.RAIL_0; i <= TILE_ID.RAIL_15; i++) {
        railSet.addValue(i);
    }


    this.tileSets.addValue(allSet);
    this.tileSets.addValue(roadSet);
    this.tileSets.addValue(canyonSet);
    this.tileSets.addValue(groundSet);
    this.tileSets.addValue(shoreSet);
    this.tileSets.addValue(riverSet);
    this.tileSets.addValue(seaSet);
    this.tileSets.addValue(railSet);
    
    this.brushSizes.addValue(fillBrushSize(0, 0));
    this.brushSizes.addValue(fillBrushSize(1, 1));
    this.brushSizes.addValue(fillBrushSize(2, 2));
    this.brushSizes.addValue(fillBrushSize(3, 3));
    this.brushSizes.addValue(fillBrushSize(4, 4));
}

EditorController.prototype.getSizeInfo = function() {
    const { width, height } = this.brushSizes.getValue();
    const pageString = this.brushSizes.getPageString();
    const paintWidth = (width + 1) * 2 - 1;
    const paintHeight = (height + 1) * 2 - 1;

    return `SIZE: ${paintWidth}x${paintHeight} (${pageString})`;
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

    cursor.events.on(Cursor.EVENT.DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.draw(gameContext);
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.draw(gameContext);
        }
    });
}

EditorController.prototype.draw = function(gameContext) {
    const { x, y } = getCursorTile(gameContext);

    switch(this.mode) {
        case EditorController.MODE.TILE: {
            this.editor.paint(gameContext, x, y);
            break;
        }
        case EditorController.MODE.ENTITY: {
            //TODO(neyn): Add entity placement!
            break;
        }
    }
}

EditorController.prototype.changeMode = function() {
    switch(this.mode) {
        case EditorController.MODE.TILE: {
            this.mode = EditorController.MODE.ENTITY;
            break;
        }
        case EditorController.MODE.ENTITY: {
            this.mode = EditorController.MODE.TILE;
            break;
        }
    }
}

EditorController.prototype.getCurrentSet = function() {
    switch(this.mode) {
        case EditorController.MODE.TILE: return this.tileSets.getValue();
        case EditorController.MODE.ENTITY: return this.entitySets.getValue();
        default: return this.tileSets.getValue();
    }
}

EditorController.prototype.updatePage = function(gameContext, delta) {
    const palletSize = this.getCurrentSet().getSize();
    const maxPagesNeeded = Math.ceil(palletSize / BUTTON_COUNT);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }

    this.updateMenuText(gameContext);
}

EditorController.prototype.updateBrushSize = function(gameContext, delta) {
    const { width, height } = this.brushSizes.scroll(delta);

    this.editor.brush.setSize(width, height);
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

EditorController.prototype.resizeCurrentMap = function(camera) {
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

    this.editor.autofillMap();

    camera.jumpToTile(0, 0);
}

EditorController.prototype.getPageText = function() {
    const palletSize = this.getCurrentSet().getSize();
    const maxPagesNeeded = Math.ceil(palletSize / BUTTON_COUNT);
    const showMaxPagesNeeded = maxPagesNeeded === 0 ? 1 : maxPagesNeeded;
    const showCurrentPage = this.pageIndex + 1;

    return `${showCurrentPage} / ${showMaxPagesNeeded}`;
}

EditorController.prototype.updateMenuText = function(gameContext) {
    const { language } = gameContext;
    const nameID = this.getCurrentSet().name;
    const tilesetName = language.getSystemTranslation(nameID);

    this.userInterface.getElement("TEXT_PAGE").setText(this.getPageText());
    this.userInterface.getElement("TEXT_SIZE").setText(this.getSizeInfo());
    this.userInterface.getElement("TEXT_TILESET").setText(tilesetName);

    switch(this.mode) {
        case EditorController.MODE.TILE: {
            this.userInterface.getElement("TEXT_TILESET_MODE").setText("TILE MODE");
            break;
        }
        case EditorController.MODE.ENTITY: {
            this.userInterface.getElement("TEXT_TILESET_MODE").setText("ENTITY MODE");
            break;
        }
        default: {
            this.userInterface.getElement("TEXT_TILESET_MODE").setText("NO MODE");
            break;
        }
    }
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
        const worldMap = createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        if(worldMap) {
            this.editor.setTargetMap(worldMap);
            this.editor.autofillMap();
        }
    }
}

EditorController.prototype.loadMap = async function(gameContext) {
    const { language } = gameContext;
    const mapID = prompt(language.getSystemTranslation("EDITOR_LOAD_MAP"));
    const worldMap = await createEditorMap(gameContext, mapID);

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

EditorController.prototype.initUIEvents = function(gameContext, camera) {
    const { states } = gameContext;

    this.userInterface.addClickByName("BUTTON_INVERT", (e) => this.toggleInversion());
    this.userInterface.addClickByName("BUTTON_BACK", (e) => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    this.userInterface.addClickByName("BUTTON_AUTO", (e) => this.toggleAutotiler());

    this.userInterface.addClickByName("BUTTON_TILESET_MODE", (e) => {
        this.changeMode();
        this.pageIndex = 0;
        this.resetBrush();
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_TILESET_LEFT", (e) => {
        this.tileSets.loop(-1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_TILESET_RIGHT", (e) => {
        this.tileSets.loop(1);
        this.pageIndex = 0;
        this.updateMenuText(gameContext);
    });

    this.userInterface.addClickByName("BUTTON_PERMUTATION", (e) => this.togglePermutation());
    this.userInterface.addClickByName("BUTTON_PAGE_LAST", (e) => this.updatePage(gameContext, -1)); 
    this.userInterface.addClickByName("BUTTON_PAGE_NEXT", (e) => this.updatePage(gameContext, 1));  
    this.userInterface.addClickByName("BUTTON_SCROLL_SIZE", (e) => this.updateBrushSize(gameContext, 1));
    this.userInterface.addClickByName("BUTTON_SAVE", (e) => this.saveMap());
    this.userInterface.addClickByName("BUTTON_CREATE", (e) => this.createMap(gameContext));
    this.userInterface.addClickByName("BUTTON_LOAD", (e) => this.loadMap(gameContext));
    this.userInterface.addClickByName("BUTTON_RESIZE", (e) => this.resizeCurrentMap(camera)); 
    this.userInterface.addClickByName("BUTTON_UNDO", (e) => this.editor.undo(gameContext)); 
    this.userInterface.addClickByName("BUTTON_ERASER", (e) => this.toggleEraser());
    this.userInterface.addClickByName("BUTTON_VIEW_ALL", (e) => this.viewAllLayers());

    this.userInterface.addClickByName("BUTTON_L1", (e) => this.clickLayerButton(EditorController.LAYER_BUTTON.L1));
    this.userInterface.addClickByName("BUTTON_L2", (e) => this.clickLayerButton(EditorController.LAYER_BUTTON.L2));
    this.userInterface.addClickByName("BUTTON_L3", (e) => this.clickLayerButton(EditorController.LAYER_BUTTON.L3));
}