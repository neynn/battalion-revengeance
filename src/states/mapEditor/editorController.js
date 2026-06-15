import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { MapSystem } from "../../systems/map.js";
import { clampValue } from "../../../engine/math/math.js";
import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";
import { TileTool } from "./tools/tileTool.js";
import { BUILDING_TYPE, CLIMATE_TYPE, COLOR_TYPE, FACTION_TYPE } from "../../enums.js";
import { createBuildingSnapshotFromJSON } from "../../snapshot/buildingSnapshot.js";
import { BuildingProxy } from "../../proxies/buildingProxy.js";
import { TextureRegistry } from "../../../engine/resources/texture/textureRegistry.js";
import { BuildingTool } from "./tools/buildingTool.js";

export const EditorController = function(mapEditor) {
    this.editor = mapEditor;
    this.maxWidth = 100;
    this.maxHeight = 100;
    this.defaultWidth = 20;
    this.defaultHeight = 20;

    this.tileTool = new TileTool(mapEditor);
    this.buildingTool = new BuildingTool();

    this.lastUseX = -1;
    this.lastUseY = -1;

    this.currentTab = EditorController.TAB_TYPE.NONE;
    this.currentColor = COLOR_TYPE.RED;
    this.currentFaction = FACTION_TYPE.RED;
    this.currentBuilding = BUILDING_TYPE.COMMAND_CENTER;
    this.editorTexture = TextureRegistry.EMPTY_TEXTURE;
}

EditorController.TAB_TYPE = {
    NONE: 0,
    TILE: 1,
    UNIT: 2,
    BUILDING: 3
};

EditorController.prototype.selectBuilding = function(gameContext, buildingID) {
    if(buildingID < 0 || buildingID >= BUILDING_TYPE._COUNT) {
        return;
    }

    this.currentBuilding = buildingID;
}

EditorController.prototype.selectTileTab = function(gameContext, userInterface) {
    switch(this.currentTab) {
        //Clear last tab.
    }

    this.tileTool.onEnable(gameContext, userInterface);
    this.currentTab = EditorController.TAB_TYPE.TILE;
}

EditorController.prototype.selectUnitTab = function(gameContext) {
    //Switch back to the red (default) faction if the unclaimed was used before.
    if(this.currentFaction === FACTION_TYPE._INVALID) {
        this.selectFaction(gameContext, FACTION_TYPE.RED);
    }

    this.currentTab = EditorController.TAB_TYPE.UNIT; 
}

EditorController.prototype.selectBuildingTab = function(gameContext) {
    this.currentTab = EditorController.TAB_TYPE.BUILDING;
}

EditorController.prototype.selectFaction = function(gameContext, factionID) {
    const { typeRegistry } = gameContext;

    switch(factionID) {
        case FACTION_TYPE._INVALID: {
            this.currentColor = COLOR_TYPE.BUILDING;
            this.currentFaction = factionID;
            break;
        }
        case FACTION_TYPE.RED: 
        case FACTION_TYPE.BLUE:
        case FACTION_TYPE.YELLOW:
        case FACTION_TYPE.GREEN:
        case FACTION_TYPE.DARK_RED:
        case FACTION_TYPE.DARK_BLUE:
        case FACTION_TYPE.BRONZE:
        case FACTION_TYPE.DARK_BLUE: {
            const { color } = typeRegistry.getFactionType(factionID);

            this.currentColor = color;
            this.currentFaction = factionID;
            break;
        }
    }
} 

EditorController.prototype.loadArenaAssets = function(gameContext) {
    const { typeRegistry, spriteController } = gameContext;
    const factions = [
        FACTION_TYPE.RED,
        FACTION_TYPE.BLUE,
        FACTION_TYPE.YELLOW,
        FACTION_TYPE.GREEN,
        FACTION_TYPE.DARK_RED,
        FACTION_TYPE.DARK_BLUE,
        FACTION_TYPE.BRONZE,
        FACTION_TYPE.DARK_GREEN
    ];

    const colors = [];

    for(const factionID of factions) {
        const { color } = typeRegistry.getFactionType(factionID);

        if(!colors.includes(color)) {
            colors.push(color);
        }
    }

    spriteController.bufferBuildingSprites(gameContext, colors);
}

EditorController.prototype.scroolTool = function(gameContext, direction) {
    switch(this.currentTab) {
        case EditorController.TAB_TYPE.TILE: {
            switch(direction) {
                case Cursor.SCROLL.UP: {
                    this.tileTool.onScrollUp(gameContext);
                    break;
                }
                case Cursor.SCROLL.DOWN: {
                    this.tileTool.onScrollDown(gameContext);
                    break;
                }
            }
            break;
        }
    } 
}

EditorController.prototype.useTool = function(gameContext, tileX, tileY) {
    switch(this.currentTab) {
        case EditorController.TAB_TYPE.TILE: {
            this.tileTool.onUse(gameContext, tileX, tileY);
            break;
        }
        default: {
            console.error("Unsupported ToolType!");
            break;
        }
    }
}

EditorController.prototype.initCursorEvents = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.SCROLL, ({ direction }) => this.scroolTool(gameContext, direction));

    cursor.events.on(Cursor.EVENT.DRAG, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            if(this.lastUseX !== x || this.lastUseY !== y) {
                this.useTool(gameContext, x, y);
                this.lastUseX = x;
                this.lastUseY = y;
            }
        }
    });

    cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        if(button === Cursor.BUTTON.RIGHT) {
            const { x, y } = getCursorTile(gameContext);

            this.useTool(gameContext, x, y);
            this.lastUseX = -1;
            this.lastUseY = -1;
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
        .download("map_error");
    }

    const layers = worldMap.saveLayers();
    const flags = worldMap.saveFlags();
    const buildings = this.buildingTool.saveBuildings();

    new PrettyJSON(4)
    .open()
    .writeLine("width", worldMap.width)
    .writeLine("height", worldMap.height)
    .writeList("buildings", buildings, PrettyJSON.LIST_TYPE.ARRAY)
    .writeLine("flags", flags)
    .writeList("data", layers)
    .close()
    .download("map_" + worldMap.getID());
}

EditorController.prototype.createMap = function(gameContext) {
    const { language } = gameContext;
    const createNew = confirm("This will create and load a brand new map! Proceed?");

    if(createNew) {
        const worldMap = MapSystem.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        this.editor.setTargetMap(worldMap);
        this.editor.autofillMap();
    }
}

EditorController.prototype.loadMap = async function(gameContext) {
    const { language, scenarioRegistry, mapRegistry } = gameContext;
    const scenarioID = prompt(language.getSystemTranslation("EDITOR_LOAD_MAP"));
    const scenario = scenarioRegistry.getScenario(scenarioID);  

    if(scenario) {
        MapSystem.getMapFile(gameContext, scenario.mapID)
        .then(file => {
            const { width, height, data, buildings = [], flags = [], climate = null } = file;
            const worldMap = MapSystem.createEmptyMap(gameContext, width, height);

            worldMap.climate = CLIMATE_TYPE[climate] ?? CLIMATE_TYPE.TEMPERATE;
            worldMap.loadFlags(flags);
            worldMap.decodeLayers(data);

            for(let i = 0; i < buildings.length; i++) {
                this.buildingTool.createProxiesFromData(buildings[i]);
            }

            this.editor.setTargetMap(worldMap);
        })
        .catch(() => {
            const worldMap = MapSystem.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

            this.editor.setTargetMap(worldMap);
            this.editor.autofillMap();
        });
    } else {
        const worldMap = MapSystem.createEmptyMap(gameContext, this.defaultWidth, this.defaultHeight);

        this.editor.setTargetMap(worldMap);
        this.editor.autofillMap();
    }
}