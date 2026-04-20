import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { BattalionContext } from "../../battalionContext.js";
import { createEditorMap, createEmptyMap } from "../../systems/map.js";
import { clampValue } from "../../../engine/math/math.js";
import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";
import { EditorTool } from "./tools/tool.js";
import { TileTool } from "./tools/tileTool.js";
import { EntityTool } from "./tools/entityTool.js";

export const EditorController = function(mapEditor) {
    this.editor = mapEditor;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.defaultWidth = 20;
    this.defaultHeight = 20;
    this.tools = [
        new EditorTool(),
        new TileTool(mapEditor),
        new EntityTool()
    ];

    this.tool = EditorController.TOOL.NONE;
}

EditorController.TOOL = {
    NONE: 0,
    TILE: 1,
    ENTITY: 2
};

EditorController.prototype.useTool = function(gameContext) {
    const tool = this.tools[this.tool];
    const { x, y } = getCursorTile(gameContext);

    tool.onClick(gameContext, x, y);
}

EditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => {
        switch(direction) {
            case Cursor.SCROLL.UP: {
                this.tools[this.tool].onScrollUp(gameContext);
                break;
            }
            case Cursor.SCROLL.DOWN: {
                this.tools[this.tool].onScrollDown(gameContext);
                break;
            }
        }
    });

    cursor.events.on(Cursor.EVENT.DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.useTool(gameContext);
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            this.useTool(gameContext);
        }
    });
}

EditorController.prototype.resizeCurrentMap = function() {
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

EditorController.prototype.selectTool = function(gameContext, userInterface, toolID) {
    if(toolID < 0 || toolID >= this.tools.length) {
        return;
    }

    if(toolID === this.tool) {
        return;
    }

    this.tools[this.tool].onDisable(gameContext);
    this.tools[toolID].onEnable(gameContext, userInterface);
    this.tool = toolID;
}