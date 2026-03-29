import { DEBUG } from "../../engine/debug.js";
import { AttackAction } from "../action/types/attack.js";
import { CaptureAction } from "../action/types/capture.js";
import { CloakAction } from "../action/types/cloak.js";
import { DeathAction } from "../action/types/death.js";
import { EndTurnAction } from "../action/types/endTurn.js";
import { EntitySpawnAction } from "../action/types/entitySpawn.js";
import { ExplodeTileAction } from "../action/types/explodeTile.js";
import { ExtractAction } from "../action/types/extract.js";
import { HealAction } from "../action/types/heal.js";
import { MineTriggerAction } from "../action/types/mineTrigger.js";
import { MoveAction } from "../action/types/move.js";
import { ProduceEntityAction } from "../action/types/produceEntity.js";
import { PurchaseEntityAction } from "../action/types/purchaseEntity.js";
import { StartTurnAction } from "../action/types/startTurn.js";
import { UncloakAction } from "../action/types/uncloak.js";
import { ACTION_TYPE } from "../enums.js";
import { createClientEntityObject, createServerEntityObject, despawnClientEntity, despawnServerEntity } from "./spawn.js";

export const registerClientActions = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.registerAction(ACTION_TYPE.MINE_TRIGGER, new MineTriggerAction());
    actionQueue.registerAction(ACTION_TYPE.PRODUCE_ENTITY, new ProduceEntityAction(createClientEntityObject));
    actionQueue.registerAction(ACTION_TYPE.PURCHASE_ENTITY, new PurchaseEntityAction(createClientEntityObject));
    actionQueue.registerAction(ACTION_TYPE.EXTRACT, new ExtractAction());
    actionQueue.registerAction(ACTION_TYPE.ENTITY_SPAWN, new EntitySpawnAction(createClientEntityObject));
    actionQueue.registerAction(ACTION_TYPE.START_TURN, new StartTurnAction());
    actionQueue.registerAction(ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction(despawnClientEntity));
    actionQueue.registerAction(ACTION_TYPE.CAPTURE, new CaptureAction());
    actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());
    actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    actionQueue.registerAction(ACTION_TYPE.CLOAK, new CloakAction());
    actionQueue.registerAction(ACTION_TYPE.DEATH, new DeathAction(despawnClientEntity));
    actionQueue.registerAction(ACTION_TYPE.UNCLOAK, new UncloakAction());
    actionQueue.registerAction(ACTION_TYPE.END_TURN, new EndTurnAction());
}

export const registerServerActions = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.registerAction(ACTION_TYPE.MINE_TRIGGER, new MineTriggerAction());
    actionQueue.registerAction(ACTION_TYPE.PRODUCE_ENTITY, new ProduceEntityAction(createServerEntityObject));
    actionQueue.registerAction(ACTION_TYPE.PURCHASE_ENTITY, new PurchaseEntityAction(createServerEntityObject));
    actionQueue.registerAction(ACTION_TYPE.EXTRACT, new ExtractAction());
    actionQueue.registerAction(ACTION_TYPE.ENTITY_SPAWN, new EntitySpawnAction(createServerEntityObject));
    actionQueue.registerAction(ACTION_TYPE.START_TURN, new StartTurnAction());
    actionQueue.registerAction(ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction(despawnServerEntity));
    actionQueue.registerAction(ACTION_TYPE.CAPTURE, new CaptureAction());
    actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());
    actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    actionQueue.registerAction(ACTION_TYPE.CLOAK, new CloakAction());
    actionQueue.registerAction(ACTION_TYPE.DEATH, new DeathAction(despawnServerEntity));
    actionQueue.registerAction(ACTION_TYPE.UNCLOAK, new UncloakAction());
    actionQueue.registerAction(ACTION_TYPE.END_TURN, new EndTurnAction());
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