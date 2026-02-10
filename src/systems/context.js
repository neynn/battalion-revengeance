import { Renderer } from "../../engine/renderer/renderer.js";
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

export const registerActions = function(gameContext, isServer) {
    const { world } = gameContext;
    const { actionQueue } = world;

    actionQueue.registerAction(ACTION_TYPE.MINE_TRIGGER, new MineTriggerAction());
    actionQueue.registerAction(ACTION_TYPE.PRODUCE_ENTITY, new ProduceEntityAction(isServer));
    actionQueue.registerAction(ACTION_TYPE.PURCHASE_ENTITY, new PurchaseEntityAction(isServer));
    actionQueue.registerAction(ACTION_TYPE.EXTRACT, new ExtractAction());
    actionQueue.registerAction(ACTION_TYPE.ENTITY_SPAWN, new EntitySpawnAction(isServer));
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
}

export const addDebug = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;

    router.bind(gameContext, "DEBUG");
    router.on("DEBUG_MAP", () => Renderer.DEBUG.MAP = 1 - Renderer.DEBUG.MAP);
    router.on("DEBUG_CONTEXT", () => Renderer.DEBUG.CONTEXT = 1 - Renderer.DEBUG.CONTEXT);
    router.on("DEBUG_INTERFACE", () => Renderer.DEBUG.INTERFACE = 1 - Renderer.DEBUG.INTERFACE);
    router.on("DEBUG_SPRITES", () => Renderer.DEBUG.SPRITES = 1 - Renderer.DEBUG.SPRITES);
    router.on("DEBUG_INFO", () => Renderer.DEBUG.INFO = 1 - Renderer.DEBUG.INFO);
}