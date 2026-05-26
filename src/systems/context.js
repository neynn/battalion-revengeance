import { AttackAction, AttackActionVTable } from "../action/types/attack.js";
import { CaptureAction, CaptureActionVTable } from "../action/types/capture.js";
import { CloakAction, CloakActionVTable } from "../action/types/cloak.js";
import { DeathAction, DeathActionVTable } from "../action/types/death.js";
import { EndTurnAction, EndTurnVTable } from "../action/types/endTurn.js";
import { EntitySpawnAction, EntitySpawnVTable } from "../action/types/entitySpawn.js";
import { ExplodeTileAction, ExplodeTileVTable } from "../action/types/explodeTile.js";
import { ExtractAction, ExtractVTable } from "../action/types/extract.js";
import { HealAction, HealVTable } from "../action/types/heal.js";
import { MineTriggerAction, MineTriggerVTable } from "../action/types/mineTrigger.js";
import { MoveAction, MoveVTable } from "../action/types/move.js";
import { ProduceEntityAction, ProduceVTable } from "../action/types/produceEntity.js";
import { PurchaseEntityAction, PurchaseVTable } from "../action/types/purchaseEntity.js";
import { InterruptAction, InterruptVTable } from "../action/types/interrupt.js";
import { StartTurnAction, StartTurnVTable } from "../action/types/startTurn.js";
import { UncloakAction, UncloakVTable } from "../action/types/uncloak.js";
import { ACTION_TYPE, AUTOTILER_TYPE, TILE_ID, TILE_TYPE } from "../enums.js";
import { ToTransportAction, ToTransportVTable } from "../action/types/toTransport.js";
import { FromTransportAction, FromTransportVTable } from "../action/types/fromTransport.js";
import { Renderer2D } from "../../engine/renderer/renderer2D.js";
import { Autotiler } from "../../engine/tile/autotiler.js";

const TILE_CATEGORY = {
    _INVALID: -1,
    ROAD: 0,
    RIVER: 1,
    PATH: 2,
    CANYON: 3,
    RAIL: 4,
    SHORE: 5,
    _COUNT: 6
};

const PATH_VALUES = {
    0: TILE_ID.PATH_0 + 8,
    1: TILE_ID.PATH_0 + 13,
    2: TILE_ID.PATH_0 + 12,
    3: TILE_ID.PATH_0 + 3,
    4: TILE_ID.PATH_0 + 14,
    5: TILE_ID.PATH_0 + 0,
    6: TILE_ID.PATH_0 + 9,
    7: TILE_ID.NONE,
    8: TILE_ID.PATH_0 + 11,
    9: TILE_ID.PATH_0 + 10,
    10: TILE_ID.PATH_0 + 2,
    11: TILE_ID.NONE,
    12: TILE_ID.PATH_0 + 1,
    13: TILE_ID.NONE,
    14: TILE_ID.NONE,
    15: TILE_ID.NONE
};

const ROAD_VALUES = {
    0: TILE_ID.ROAD_0 + 0,
    1: TILE_ID.ROAD_0 + 5,
    2: TILE_ID.ROAD_0 + 7,
    3: TILE_ID.ROAD_0 + 11,
    4: TILE_ID.ROAD_0 + 6,
    5: TILE_ID.ROAD_0 + 10,
    6: TILE_ID.ROAD_0 + 2,
    7: TILE_ID.ROAD_0 + 14,
    8: TILE_ID.ROAD_0 + 4,
    9: TILE_ID.ROAD_0 + 1,
    10: TILE_ID.ROAD_0 + 9,
    11: TILE_ID.ROAD_0 + 13,
    12: TILE_ID.ROAD_0 + 8,
    13: TILE_ID.ROAD_0 + 12,
    14: TILE_ID.ROAD_0 + 15,
    15: TILE_ID.ROAD_0 + 3
};

const RIVER_VALUES = {
    0: TILE_ID.RIVER_0 + 10,
    1: TILE_ID.RIVER_0 + 43,
    2: TILE_ID.RIVER_0 + 46,
    3: TILE_ID.RIVER_0 + 6,
    4: TILE_ID.RIVER_0 + 5,
    5: TILE_ID.RIVER_0 + 45,
    6: TILE_ID.RIVER_0 + 1,
    7: TILE_ID.RIVER_0 + 0,

    8: TILE_ID.RIVER_0 + 9,
    9: TILE_ID.RIVER_0 + 29,
    10: TILE_ID.RIVER_0 + 30,
    11: TILE_ID.RIVER_0 + 28,
    12: TILE_ID.RIVER_0 + 27,
    13: TILE_ID.RIVER_0 + 44,
    14: TILE_ID.RIVER_0 + 2,
    15: TILE_ID.RIVER_0 + 8,

    16: TILE_ID.RIVER_0 + 38,
    17: TILE_ID.RIVER_0 + 36,
    18: TILE_ID.RIVER_0 + 4,
    19: TILE_ID.RIVER_0 + 34,
    20: TILE_ID.RIVER_0 + 32,
    21: TILE_ID.RIVER_0 + 41,
    22: TILE_ID.RIVER_0 + 19,
    23: TILE_ID.RIVER_0 + 14,

    24: TILE_ID.RIVER_0 + 17,
    25: TILE_ID.RIVER_0 + 12,
    26: TILE_ID.RIVER_0 + 7,
    27: TILE_ID.RIVER_0 + 37,
    28: TILE_ID.RIVER_0 + 35,
    29: TILE_ID.RIVER_0 + 42,
    30: TILE_ID.RIVER_0 + 22,
    31: TILE_ID.RIVER_0 + 25,

    32: TILE_ID.RIVER_0 + 20,
    33: TILE_ID.RIVER_0 + 23,
    34: TILE_ID.RIVER_0 + 3,
    35: TILE_ID.RIVER_0 + 33,
    36: TILE_ID.RIVER_0 + 31,
    37: TILE_ID.RIVER_0 + 40,
    38: TILE_ID.RIVER_0 + 18,
    39: TILE_ID.RIVER_0 + 13,

    40: TILE_ID.RIVER_0 + 16,
    41: TILE_ID.RIVER_0 + 11,
    42: TILE_ID.RIVER_0 + 39,
    43: TILE_ID.RIVER_0 + 21,
    44: TILE_ID.RIVER_0 + 24,
    45: TILE_ID.RIVER_0 + 15,
    46: TILE_ID.RIVER_0 + 10,
    47: TILE_ID.RIVER_0 + 26
};

export const loadVisualTiles = function(gameContext) {
    const { tileManager } = gameContext;

    tileManager.registerVisual(TILE_ID.GRASS, "plains", "plains_1");
    tileManager.registerVisual(TILE_ID.BOREAL, "boreal", "boreal_1");
    tileManager.registerVisual(TILE_ID.ARCTIC, "arctic", "arctic_1");
    tileManager.registerVisualsAuto(TILE_ID.ROAD_0, "road", "", 16);
    tileManager.registerVisual(TILE_ID.VOLANO, "volcano", "ANIMATION_0");
    tileManager.registerVisualsAuto(TILE_ID.RIVER_0, "river", "ANIMATION_", 48);
    tileManager.registerVisualsAuto(TILE_ID.SHORE_0, "shore", "ANIMATION_", 12);
    tileManager.registerVisualsAuto(TILE_ID.ISLAND_1, "water", "ANIMATION_ISLAND_", 4);
    tileManager.registerVisualsAuto(TILE_ID.SWIRL_1, "water", "ANIMATION_SWIRL_", 4);
    tileManager.registerVisualsAuto(TILE_ID.ROCKS_1, "water", "ANIMATION_ROCKS_", 4);
    tileManager.registerVisual(TILE_ID.OVERLAY_MOVE, "other", "overlay_0");
    tileManager.registerVisual(TILE_ID.OVERLAY_MOVE_ATTACK, "other", "overlay_1");
    tileManager.registerVisual(TILE_ID.OVERLAY_ATTACK_LIGHT, "other", "overlay_2");
    tileManager.registerVisual(TILE_ID.OVERLAY_ATTACK, "other", "overlay_3");
    tileManager.registerVisualsAuto(TILE_ID.PATH_0, "path", "", 16);
    tileManager.registerVisual(TILE_ID.JAMMER, "other", "jammer");
    tileManager.registerVisual(TILE_ID.ORE_LEFT, "ore_deposit", "LEFT");
    tileManager.registerVisual(TILE_ID.ORE_RIGHT, "ore_deposit", "RIGHT");
    tileManager.registerVisual(TILE_ID.ORE_LEFT_USED, "ore_deposit", "LEFT_USED");
    tileManager.registerVisual(TILE_ID.ORE_RIGHT_USED, "ore_deposit", "RIGHT_USED");
    tileManager.registerVisual(TILE_ID.ORE_LEFT_DEPLETED, "ore_deposit", "LEFT_DEPLETED");
    tileManager.registerVisual(TILE_ID.ORE_RIGHT_DEPLETED, "ore_deposit", "RIGHT_DEPLETED");
    tileManager.registerVisualsAuto(TILE_ID.CANYON_0, "canyon", "", 48);
    tileManager.registerVisualsAuto(TILE_ID.RAIL_0, "rail", "", 16);

    tileManager.registerVisual(TILE_ID.MINE_LAND, "other", "mine_0");
    tileManager.registerVisual(TILE_ID.MINE_SEA, "other", "mine_1");
    tileManager.registerVisual(TILE_ID.MARKER_WEAK, "other", "marker_weak");
    tileManager.registerVisual(TILE_ID.MARKER, "other", "marker");
    tileManager.registerVisual(TILE_ID.MARKER_PROTECTED, "other", "marker_protected");
    tileManager.registerVisual(TILE_ID.CASH_BOX, "other", "cash_box");

    tileManager.registerVisuals(TILE_ID.PLAINS_GROUND_1, "plains", [
        "plains_1", "plains_2", "plains_3", "plains_4", "plains_5", "plains_6", "plains_7", "plains_8",
        "shrub_1", "shrub_2", "shrub_3", "shrub_4", "shrub_5",
        "forest_1", "forest_2", "forest_3", "forest_4",
        "mountain_1", "mountain_2", "mountain_3", "mountain_4", "megamountain",
        "hills_1", "hills_2", "hills_3", "hills_4"
    ]);
    
    tileManager.registerVisuals(TILE_ID.BOREAL_GROUND_1, "boreal", [
        "boreal_1", "boreal_2", "boreal_3", "boreal_4", "boreal_5", "boreal_6", "boreal_7", "boreal_8",
        "forest_1", "forest_2", "forest_3", "forest_4",
        "mountain_1", "mountain_2", "mountain_3", "mountain_4", "megamountain",
        "hills_1", "hills_2", "hills_3", "hills_4"
    ]);

    tileManager.registerVisuals(TILE_ID.ARCTIC_GROUND_1, "arctic", [
        "arctic_1", "arctic_2", "arctic_3", "arctic_4", "arctic_5", "arctic_6", "arctic_7", "arctic_8",
        "forest_1", "forest_2", "forest_3", "forest_4",
        "mountain_1", "mountain_2", "mountain_3", "mountain_4", "megamountain",
        "hills_1", "hills_2", "hills_3", "hills_4"
    ]);
}

export const loadTiles = function(gameContext) {
    const { tileManager } = gameContext;

    tileManager.initTables(TILE_ID._COUNT);
    tileManager.createCategories(TILE_CATEGORY._COUNT);
    tileManager.createAutotilers(AUTOTILER_TYPE._COUNT);

    tileManager.registerTile(TILE_ID.GRASS, TILE_TYPE.GRASS, -1, -1);
    tileManager.registerTile(TILE_ID.BOREAL, TILE_TYPE.BOREAL, -1, -1);
    tileManager.registerTile(TILE_ID.ARCTIC, TILE_TYPE.ARCTIC, -1, -1);
    tileManager.registerTiles(TILE_ID.ROAD_0, TILE_ID.ROAD_15, TILE_TYPE.ROAD, AUTOTILER_TYPE.ROAD, TILE_CATEGORY.ROAD);
    tileManager.registerTile(TILE_ID.VOLANO, TILE_TYPE.VOLCANO, -1, -1);
    tileManager.registerTiles(TILE_ID.RIVER_0, TILE_ID.RIVER_47, TILE_TYPE.RIVER, AUTOTILER_TYPE.RIVER, TILE_CATEGORY.RIVER);
    tileManager.registerTiles(TILE_ID.SHORE_0, TILE_ID.SHORE_11, TILE_TYPE.SHORE, -1, TILE_CATEGORY.SHORE);
    tileManager.registerTiles(TILE_ID.ISLAND_1, TILE_ID.ISLAND_4, TILE_TYPE.ISLAND, -1, -1);
    tileManager.registerTiles(TILE_ID.SWIRL_1, TILE_ID.SWIRL_4, TILE_TYPE.SWIRL, -1, -1);
    tileManager.registerTiles(TILE_ID.ROCKS_1, TILE_ID.ROCKS_4, TILE_TYPE.ROCKS, -1, -1);
    tileManager.registerTiles(TILE_ID.PATH_0, TILE_ID.PATH_15, TILE_TYPE.PATH, AUTOTILER_TYPE.PATH, TILE_CATEGORY.PATH);
    tileManager.registerTile(TILE_ID.ORE_LEFT, TILE_TYPE.RICH_ORE, -1, -1);
    tileManager.registerTile(TILE_ID.ORE_RIGHT, TILE_TYPE.RICH_ORE, -1, -1);
    tileManager.registerTile(TILE_ID.ORE_LEFT_USED, TILE_TYPE.USED_ORE, -1, -1);
    tileManager.registerTile(TILE_ID.ORE_RIGHT_USED, TILE_TYPE.USED_ORE, -1, -1);
    tileManager.registerTile(TILE_ID.ORE_LEFT_DEPLETED, TILE_TYPE.DEPLETED_ORE, -1, -1);
    tileManager.registerTile(TILE_ID.ORE_RIGHT_DEPLETED, TILE_TYPE.DEPLETED_ORE, -1, -1);
    tileManager.registerTiles(TILE_ID.CANYON_0, TILE_ID.CANYON_47, TILE_TYPE.CANYON, AUTOTILER_TYPE.CANYON, TILE_CATEGORY.CANYON);
    tileManager.registerTiles(TILE_ID.RAIL_0, TILE_ID.RAIL_15, TILE_TYPE.RAIL, AUTOTILER_TYPE.RAIL, TILE_CATEGORY.RAIL);
    tileManager.registerTiles(TILE_ID.PLAINS_GROUND_1, TILE_ID.PLAINS_SHRUB_1, TILE_TYPE.GRASS);
    tileManager.registerTiles(TILE_ID.PLAINS_FOREST_1, TILE_ID.PLAINS_FOREST_4, TILE_TYPE.FOREST);
    tileManager.registerTiles(TILE_ID.PLAINS_MOUNTAIN_1, TILE_ID.PLAINS_MOUNTAIN_5, TILE_TYPE.MOUNTAIN);
    tileManager.registerTiles(TILE_ID.PLAINS_HILLS_1, TILE_ID.PLAINS_HILLS_4, TILE_TYPE.HILL);
    
    //TODO(neyn): Add boreal tiles!

    tileManager.loadAutotiler(AUTOTILER_TYPE.PATH, Autotiler.TYPE.MIN_4, [TILE_CATEGORY.PATH]);
    tileManager.loadAutotiler(AUTOTILER_TYPE.ROAD, Autotiler.TYPE.MIN_4, [TILE_CATEGORY.ROAD]);
    tileManager.loadAutotiler(AUTOTILER_TYPE.RAIL, Autotiler.TYPE.MIN_4, [TILE_CATEGORY.RAIL]);
    tileManager.loadAutotiler(AUTOTILER_TYPE.RIVER, Autotiler.TYPE.MIN_8, [TILE_CATEGORY.RIVER, TILE_CATEGORY.SHORE]);
    tileManager.loadAutotiler(AUTOTILER_TYPE.CANYON, Autotiler.TYPE.MIN_8, [TILE_CATEGORY.CANYON]);

    tileManager.loadAutotilerValues(AUTOTILER_TYPE.PATH, PATH_VALUES);
    tileManager.loadAutotilerValues(AUTOTILER_TYPE.ROAD, ROAD_VALUES);
    tileManager.loadAutotilerValuesAuto(AUTOTILER_TYPE.RAIL, TILE_ID.RAIL_0);
    tileManager.loadAutotilerValues(AUTOTILER_TYPE.RIVER, RIVER_VALUES);
    tileManager.loadAutotilerValuesAuto(AUTOTILER_TYPE.CANYON, TILE_ID.CANYON_0);

    tileManager.setLogicalID(TILE_ID.RIVER_10, TILE_TYPE.SEA);
}

export const registerActionVTables = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.registerActionVTable(ACTION_TYPE.MINE_TRIGGER, MineTriggerVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.PRODUCE_ENTITY, ProduceVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.PURCHASE_ENTITY, PurchaseVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.EXTRACT, ExtractVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.ENTITY_SPAWN, EntitySpawnVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.START_TURN, StartTurnVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.EXPLODE_TILE, ExplodeTileVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.CAPTURE, CaptureActionVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.MOVE, MoveVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.HEAL, HealVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.ATTACK, AttackActionVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.CLOAK, CloakActionVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.DEATH, DeathActionVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.UNCLOAK, UncloakVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.END_TURN, EndTurnVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.INTERRUPT, InterruptVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.TO_TRANSPORT, ToTransportVTable);
    actionQueue.registerActionVTable(ACTION_TYPE.FROM_TRANSPORT, FromTransportVTable);
}

export const registerClientActions = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.registerAction(ACTION_TYPE.MINE_TRIGGER, new MineTriggerAction());
    actionQueue.registerAction(ACTION_TYPE.PRODUCE_ENTITY, new ProduceEntityAction());
    actionQueue.registerAction(ACTION_TYPE.PURCHASE_ENTITY, new PurchaseEntityAction());
    actionQueue.registerAction(ACTION_TYPE.EXTRACT, new ExtractAction());
    actionQueue.registerAction(ACTION_TYPE.ENTITY_SPAWN, new EntitySpawnAction());
    actionQueue.registerAction(ACTION_TYPE.START_TURN, new StartTurnAction());
    actionQueue.registerAction(ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction());
    actionQueue.registerAction(ACTION_TYPE.CAPTURE, new CaptureAction());
    actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());
    actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    actionQueue.registerAction(ACTION_TYPE.CLOAK, new CloakAction());
    actionQueue.registerAction(ACTION_TYPE.DEATH, new DeathAction());
    actionQueue.registerAction(ACTION_TYPE.UNCLOAK, new UncloakAction());
    actionQueue.registerAction(ACTION_TYPE.END_TURN, new EndTurnAction());
    actionQueue.registerAction(ACTION_TYPE.INTERRUPT, new InterruptAction());
    actionQueue.registerAction(ACTION_TYPE.TO_TRANSPORT, new ToTransportAction());
    actionQueue.registerAction(ACTION_TYPE.FROM_TRANSPORT, new FromTransportAction());
}

export const addDebug = function(gameContext) {
    const { client, uiManager, gameWindow, contextManager } = gameContext;
    const { router } = client;

    router.bind(gameContext, "DEBUG");
    router.on("DEBUG_MAP", () => Renderer2D.DEBUG.WORLD = !Renderer2D.DEBUG.WORLD);
    router.on("DEBUG_CONTEXT", () => contextManager.debug = !contextManager.debug);
    router.on("DEBUG_INTERFACE", () => uiManager.debug = !uiManager.debug);
    router.on("DEBUG_SPRITES", () => Renderer2D.DEBUG.SPRITES = !Renderer2D.DEBUG.SPRITES);
    router.on("DEBUG_INFO", () => gameWindow.debug = !gameWindow.debug);
}