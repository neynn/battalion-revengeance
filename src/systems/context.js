import { DEBUG } from "../../engine/debug.js";
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
import { ACTION_TYPE, TILE_ID } from "../enums.js";

export const overrideRiverTiles = function(gameContext) {
    const { tileManager } = gameContext;

    tileManager.overrideTile(TILE_ID.RIVER_10, "Sea");
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
}

export const addDebug = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;

    router.bind(gameContext, "DEBUG");
    router.on("DEBUG_MAP", () => DEBUG.WORLD = 1 -DEBUG.WORLD);
    router.on("DEBUG_CONTEXT", () => DEBUG.CONTEXT = 1 - DEBUG.CONTEXT);
    router.on("DEBUG_INTERFACE", () => DEBUG.UI = 1 - DEBUG.UI);
    router.on("DEBUG_SPRITES", () => DEBUG.SPRITES = 1 - DEBUG.SPRITES);
    router.on("DEBUG_INFO", () => DEBUG.SHOW_INFO = 1 - DEBUG.SHOW_INFO);
}