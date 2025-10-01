import { MapEditorController } from "../../engine/map/editor/mapEditorController.js";
import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../battalionContext.js";
import { BattalionMap } from "./battalionMap.js";
import { MapSpawner } from "./mapSpawner.js";

export const BattaltionEditorController = function(mapEditor, brushSets) {
    MapEditorController.call(this, mapEditor);

    this.maxWidth = 100;
    this.maxHeight = 100;
    this.interfaceID = "MAP_EDITOR";
    this.textColorView = [238, 238, 238, 255];
    this.textColorEdit = [252, 252, 63, 255];
    this.textColorHide = [207, 55, 35, 255];
    this.defaultMap = {
        "music": "music_remastered",
        "width": 20,
        "height": 20,
        "data": {
            [BattalionMap.LAYER.GROUND]: { "fill": 1 },
            [BattalionMap.LAYER.DECORATION]: { "fill": 0 },
            [BattalionMap.LAYER.CLOUD]: { "fill": 0 },
            [BattalionMap.LAYER.FLAG]: { "fill": 0 },
            [BattalionMap.LAYER.TEAM]: { "fill": 0 }
        }
    };

    this.editor.setBrushSizes([0, 1, 2, 3, 4]);
    this.editor.initBrushSets(brushSets, []);
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
    .writeLine("actors", {})
    .writeLine("entities", {})
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
        const worldMap = MapSpawner.createEmptyMap(gameContext, this.defaultMap);

        this.mapID = worldMap.getID();
    }
}

BattaltionEditorController.prototype.loadMap = async function(gameContext) {
    const mapID = prompt("MAP-ID?");
    const worldMap = await MapSpawner.createMapByID(gameContext, mapID);

    if(worldMap) {
        this.mapID = worldMap.getID();
    }
}

BattaltionEditorController.prototype.initUIEvents = function(gameContext) {
    const { uiManager, states } = gameContext;
    const editorInterface = uiManager.getGUI(this.guiID);

    editorInterface.addClick("BUTTON_INVERT", () => this.toggleInversion(gameContext));
    editorInterface.addClick("BUTTON_BACK", () => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    editorInterface.addClick("BUTTON_AUTO", () => this.toggleAutotiler(gameContext));

    editorInterface.addClick("BUTTON_TILESET_MODE", () => {
        this.editor.scrollMode(1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_LEFT", () => {
        this.editor.scrollBrushSet(-1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_TILESET_RIGHT", () => {
        this.editor.scrollBrushSet(1);
        this.resetPage();
        this.updateMenuText(gameContext);
    });

    editorInterface.addClick("BUTTON_PAGE_LAST", () => this.updatePage(gameContext, -1)); 
    editorInterface.addClick("BUTTON_PAGE_NEXT", () => this.updatePage(gameContext, 1));  
    editorInterface.addClick("BUTTON_SCROLL_SIZE", () => this.updateBrushSize(gameContext, 1));
    editorInterface.addClick("BUTTON_L1", () => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L1));
    editorInterface.addClick("BUTTON_L2", () => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L2));
    editorInterface.addClick("BUTTON_L3", () => this.clickLayerButton(gameContext, BattaltionEditorController.LAYER_BUTTON.L3));
    editorInterface.addClick("BUTTON_SAVE", () => this.saveMap(gameContext));
    editorInterface.addClick("BUTTON_CREATE", () => this.createMap(gameContext));
    editorInterface.addClick("BUTTON_LOAD", () => this.loadMap(gameContext));
    editorInterface.addClick("BUTTON_RESIZE", () => this.resizeCurrentMap(gameContext)); 
    editorInterface.addClick("BUTTON_UNDO", () => this.editor.undo(gameContext)); 
    editorInterface.addClick("BUTTON_ERASER", () => this.toggleEraser(gameContext));
    editorInterface.addClick("BUTTON_VIEW_ALL", () => this.viewAllLayers(gameContext));
}