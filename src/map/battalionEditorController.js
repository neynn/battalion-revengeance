import { MapEditorController } from "../../engine/map/editor/mapEditorController.js";
import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../battalionContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { BattalionMap } from "./battalionMap.js";
import { MapSpawner } from "./mapSpawner.js";

export const BattaltionEditorController = function(mapEditor) {
    MapEditorController.call(this, mapEditor);

    this.maxWidth = 100;
    this.maxHeight = 100;
    this.interfaceID = "MAP_EDITOR";
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
    this.defaultWidth = 20;
    this.defaultHeight = 20;
    this.fill = { [BattalionMap.LAYER_NAME.GROUND]: TypeRegistry.TILE_ID.GRASS };
    this.editor.setBrushSizes([0, 1, 2, 3, 4]);
    this.buttonHandler.createButton(BattaltionEditorController.LAYER_BUTTON.L1, BattalionMap.LAYER.GROUND, "TEXT_L1");
    this.buttonHandler.createButton(BattaltionEditorController.LAYER_BUTTON.L2, BattalionMap.LAYER.DECORATION, "TEXT_L2");
    this.buttonHandler.createButton(BattaltionEditorController.LAYER_BUTTON.L3, BattalionMap.LAYER.CLOUD, "TEXT_L3");   
}

BattaltionEditorController.LAYER_BUTTON = {
    L1: "L1",
    L2: "L2",
    L3: "L3"
};

BattaltionEditorController.prototype = Object.create(MapEditorController.prototype);
BattaltionEditorController.prototype.constructor = BattaltionEditorController;

BattaltionEditorController.prototype.loadCommands = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;

    router.bind(gameContext, "EDIT");
    router.on("TOGGLE_AUTOTILER", () => this.toggleAutotiler(gameContext));
    router.on("TOGGLE_ERASER", () => this.toggleEraser(gameContext));
    router.on("TOGGLE_INVERSION", () => this.toggleInversion(gameContext));
}

BattaltionEditorController.prototype.saveMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getMap(this.mapID);
    
    if(!worldMap) {
        return new PrettyJSON(4)
        .open()
        .writeLine("ERROR", "MAP NOT LOADED! USE CREATE OR LOAD!")
        .close()
        .download("map_" + this.mapID);
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
    .download("map_" + this.mapID);
}

BattaltionEditorController.prototype.createMap = function(gameContext) {
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const worldMap = MapSpawner.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        if(worldMap) {
            worldMap.fillLayers(this.fill);

            this.mapID = worldMap.getID();
        }
    }
}

BattaltionEditorController.prototype.loadMap = async function(gameContext) {
    const mapID = prompt("MAP-ID?");
    const worldMap = await MapSpawner.createEditorMap(gameContext, mapID);

    if(worldMap) {
        this.mapID = worldMap.getID();
    }
}

BattaltionEditorController.prototype.initUIEvents = function(gameContext) {
    const { uiManager, states } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);

    editorInterface.getElement("BUTTON_INVERT").setClick(() => this.toggleInversion(gameContext));
    editorInterface.getElement("BUTTON_BACK").setClick(() => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    editorInterface.getElement("BUTTON_AUTO").setClick(() => this.toggleAutotiler(gameContext));

    editorInterface.getElement("BUTTON_TILESET_MODE").setClick(() => {
        this.editor.scrollMode(1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.getElement("BUTTON_TILESET_LEFT").setClick(() => {
        this.editor.scrollBrushSet(-1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.getElement("BUTTON_TILESET_RIGHT").setClick(() => {
        this.editor.scrollBrushSet(1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.getElement("BUTTON_PAGE_LAST").setClick(() => this.updatePage(gameContext, -1)); 
    editorInterface.getElement("BUTTON_PAGE_NEXT").setClick(() => this.updatePage(gameContext, 1));  
    editorInterface.getElement("BUTTON_SCROLL_SIZE").setClick(() => this.updateBrushSize(gameContext, 1));
    editorInterface.getElement("BUTTON_L1").setClick(() => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L1));
    editorInterface.getElement("BUTTON_L2").setClick(() => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L2));
    editorInterface.getElement("BUTTON_L3").setClick(() => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L3));
    editorInterface.getElement("BUTTON_SAVE").setClick(() => this.saveMap(gameContext));
    editorInterface.getElement("BUTTON_CREATE").setClick(() => this.createMap(gameContext));
    editorInterface.getElement("BUTTON_LOAD").setClick(() => this.loadMap(gameContext));
    editorInterface.getElement("BUTTON_RESIZE").setClick(() => this.resizeCurrentMap(gameContext)); 
    editorInterface.getElement("BUTTON_UNDO").setClick(() => this.editor.undo(gameContext)); 
    editorInterface.getElement("BUTTON_ERASER").setClick(() => this.toggleEraser(gameContext));
    editorInterface.getElement("BUTTON_VIEW_ALL").setClick(() => this.viewAllLayers(gameContext));
}