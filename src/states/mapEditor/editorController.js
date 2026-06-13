import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { loadEditorMap, MapSystem } from "../../systems/map.js";
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
    this.lastPaintX = -1;
    this.lastPaintY = -1;
}

EditorController.TOOL = {
    NONE: 0,
    TILE: 1,
    ENTITY: 2
};

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
            const { x, y } = getCursorTile(gameContext);

            if(this.lastPaintX !== x || this.lastPaintY !== y) {
                this.tools[this.tool].onClick(gameContext, x, y);
                this.lastPaintX = x;
                this.lastPaintY = y;
            }
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            this.tools[this.tool].onClick(gameContext, x, y);
            this.lastPaintX = -1;
            this.lastPaintY = -1;
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
    .writeLine("width", worldMap.width)
    .writeLine("height", worldMap.height)
    .writeLine("buildings", [])
    .writeLine("flags", flags)
    .writeList("data", layers)
    .close()
    .download("map_" + worldMap.getID());
}

EditorController.prototype.createMap = function(gameContext) {
    const { language, spriteController } = gameContext;
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        spriteController.clearSprites(gameContext);

        const worldMap = MapSystem.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        this.editor.setTargetMap(worldMap);
        this.editor.autofillMap();
    }
}

EditorController.prototype.loadMap = async function(gameContext) {
    const { language, spriteController } = gameContext;

    spriteController.clearSprites(gameContext);

    const mapID = prompt(language.getSystemTranslation("EDITOR_LOAD_MAP"));
    const worldMap = await loadEditorMap(gameContext, mapID);

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