import { PrettyJSON } from "../../../engine/resources/prettyJSON.js";
import { MapSystem } from "../../systems/map.js";
import { clampValue } from "../../../engine/math/math.js";
import { getCursorTile } from "../../../engine/camera/contextHelper.js";
import { Cursor } from "../../../engine/client/cursor/cursor.js";
import { EditorTool } from "./tools/tool.js";
import { TileTool } from "./tools/tileTool.js";
import { EntityTool } from "./tools/entityTool.js";
import { BUILDING_TYPE, CLIMATE_TYPE, COLOR_TYPE, FACTION_TYPE } from "../../enums.js";
import { createBuildingSnapshotFromJSON } from "../../snapshot/buildingSnapshot.js";
import { BuildingProxy } from "../../proxies/buildingProxy.js";

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

    this.buildingTypeNames = new Map();
    this.buildingProxies = [];

    for(const name in BUILDING_TYPE) {
        this.buildingTypeNames.set(BUILDING_TYPE[name], name);
    }

    this.currentColor = COLOR_TYPE.RED;
    this.currentFaction = FACTION_TYPE.RED;
    this.currentTab = EditorController.TAB_TYPE.TILE;
}

EditorController.TAB_TYPE = {
    TILE: 0,
    UNIT: 1,
    BUILDING: 2
};

EditorController.TOOL = {
    NONE: 0,
    TILE: 1,
    ENTITY: 2
};

EditorController.prototype.tryPlaceBuilding = function(gameContext, typeID, tileX, tileY) {
    for(const proxy of this.buildingProxies) {
        if(proxy.tileX === tileX && proxy.tileY === tileY) {
            return;
        }
    }

    const proxy = new BuildingProxy();

    proxy.tileX = tileX;
    proxy.tileY = tileY;
    proxy.typeID = typeID;
    proxy.colorID = this.currentColor;
    proxy.factionID =this.currentFaction;

    this.buildingProxies.push(proxy);
}

EditorController.prototype.selectUnitTab = function(gameContext) {
    this.selectFaction(gameContext, FACTION_TYPE.RED);
    this.currentTab = EditorController.TAB_TYPE.UNIT;
}

EditorController.prototype.selectBuildingTab = function(gameContext) {
    this.selectFaction(gameContext, FACTION_TYPE.RED);
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

EditorController.prototype.createBuildingProxyFromData = function(data) {
    const proxy = new BuildingProxy();

    proxy.fromJSON(data);

    this.buildingProxies.push(proxy);
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
        .download("map_error");
    }

    const layers = worldMap.saveLayers();
    const flags = worldMap.saveFlags();
    const buildings = [];

    for(const proxy of this.buildingProxies) {
        buildings.push(JSON.stringify({
            "x": proxy.tileX,
            "y": proxy.tileY,
            "type": this.buildingTypeNames.get(proxy.typeID)
        }));
    }

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
                this.createBuildingProxyFromData(buildings[i]);
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