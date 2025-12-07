import { EditorController } from "../../engine/map/editor/editorController.js";
import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../battalionContext.js";
import { TILE_ID } from "../enums.js";
import { createEditorMap, createEmptyMap } from "../systems/map.js";
import { BattalionMap } from "./battalionMap.js";

export const BattalionEditorController = function(mapEditor, userInterface) {
    EditorController.call(this, mapEditor, userInterface);

    this.fill = {
        [BattalionMap.LAYER_NAME.GROUND]: TILE_ID.GRASS
    };

    this.defaultWidth = 20;
    this.defaultHeight = 20;

    this.buttonHandler.createButton(BattalionEditorController.LAYER_BUTTON.L1, BattalionMap.LAYER.GROUND, "TEXT_L1");
    this.buttonHandler.createButton(BattalionEditorController.LAYER_BUTTON.L2, BattalionMap.LAYER.DECORATION, "TEXT_L2");
    this.buttonHandler.createButton(BattalionEditorController.LAYER_BUTTON.L3, BattalionMap.LAYER.CLOUD, "TEXT_L3");   
}

BattalionEditorController.LAYER_BUTTON = {
    L1: "L1",
    L2: "L2",
    L3: "L3"
};

BattalionEditorController.prototype = Object.create(EditorController.prototype);
BattalionEditorController.prototype.constructor = BattalionEditorController;

BattalionEditorController.prototype.saveMap = function(gameContext) {
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

BattalionEditorController.prototype.createMap = function(gameContext) {
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const worldMap = createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        if(worldMap) {
            worldMap.fillLayers(this.fill);

            this.mapID = worldMap.getID();
        }
    }
}

BattalionEditorController.prototype.loadMap = async function(gameContext) {
    const { language } = gameContext;
    const mapID = prompt(language.getSystemTranslation("EDITOR_LOAD_MAP"));
    const worldMap = await createEditorMap(gameContext, mapID);

    if(worldMap) {
        this.mapID = worldMap.getID();
    }
}

BattalionEditorController.prototype.initCommands = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;

    router.bind(gameContext, "EDIT");
    router.on("TOGGLE_AUTOTILER", () => this.toggleAutotiler());
    router.on("TOGGLE_ERASER", () => this.toggleEraser());
    router.on("TOGGLE_INVERSION", () => this.toggleInversion());
}

BattalionEditorController.prototype.initUIEvents = function(gameContext) {
    const { states } = gameContext;

    this.userInterface.getElement("BUTTON_INVERT").setClick(() => this.toggleInversion());
    this.userInterface.getElement("BUTTON_BACK").setClick(() => states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU));
    this.userInterface.getElement("BUTTON_AUTO").setClick(() => this.toggleAutotiler());

    this.userInterface.getElement("BUTTON_TILESET_MODE").setClick(() => {
        this.editor.scrollMode(1);
        this.resetPage();
        this.updateMenuText();
    });

    this.userInterface.getElement("BUTTON_TILESET_LEFT").setClick(() => {
        this.editor.scrollBrushSet(-1);
        this.resetPage();
        this.updateMenuText();
    });

    this.userInterface.getElement("BUTTON_TILESET_RIGHT").setClick(() => {
        this.editor.scrollBrushSet(1);
        this.resetPage();
        this.updateMenuText();
    });

    this.userInterface.getElement("BUTTON_PAGE_LAST").setClick(() => this.updatePage(-1)); 
    this.userInterface.getElement("BUTTON_PAGE_NEXT").setClick(() => this.updatePage(1));  
    this.userInterface.getElement("BUTTON_SCROLL_SIZE").setClick(() => this.updateBrushSize(1));
    this.userInterface.getElement("BUTTON_L1").setClick(() => this.clickLayerButton(gameContext, BattalionEditorController.LAYER_BUTTON.L1));
    this.userInterface.getElement("BUTTON_L2").setClick(() => this.clickLayerButton(gameContext, BattalionEditorController.LAYER_BUTTON.L2));
    this.userInterface.getElement("BUTTON_L3").setClick(() => this.clickLayerButton(gameContext, BattalionEditorController.LAYER_BUTTON.L3));
    this.userInterface.getElement("BUTTON_SAVE").setClick(() => this.saveMap(gameContext));
    this.userInterface.getElement("BUTTON_CREATE").setClick(() => this.createMap(gameContext));
    this.userInterface.getElement("BUTTON_LOAD").setClick(() => this.loadMap(gameContext));
    this.userInterface.getElement("BUTTON_RESIZE").setClick(() => this.resizeCurrentMap(gameContext)); 
    this.userInterface.getElement("BUTTON_UNDO").setClick(() => this.editor.undo(gameContext)); 
    this.userInterface.getElement("BUTTON_ERASER").setClick(() => this.toggleEraser());
    this.userInterface.getElement("BUTTON_VIEW_ALL").setClick(() => this.viewAllLayers(gameContext));
}