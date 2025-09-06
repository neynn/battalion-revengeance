import { ActionAuthorizeEvent } from "./events/actionAuthorize.js";
import { ActionDenyEvent } from "./events/actionDeny.js";
import { ActionRequestEvent } from "./events/actionRequest.js";
import { DebrisRemovedEvent } from "./events/debrisRemoved.js";
import { DebrisSpawnEvent } from "./events/debrisSpawn.js";
import { DropEvent } from "./events/drop.js";
import { EntityCollectEvent } from "./events/entityCollect.js";
import { EntityDeathEvent } from "./events/entityDeath.js";
import { EntityDecayEvent } from "./events/entityDecay.js";
import { EntityDownEvent } from "./events/entityDown.js";
import { EntityHealEvent } from "./events/entityHeal.js";
import { EntityHitEvent } from "./events/entityHit.js";
import { EntityKillEvent } from "./events/entityKill.js";
import { EntityMoveEvent } from "./events/entityMove.js";
import { EntitySellEvent } from "./events/entitySell.js";
import { MissionCompleteEvent } from "./events/missionComplete.js";
import { MissionRewardsEvent } from "./events/missionRewards.js";
import { TileCaptureEvent } from "./events/tileCapture.js";
import { VersusRequestSkipTurnEvent } from "./events/versusRequestSkipTurn.js";
import { VersusSkipTurnEvent } from "./events/versusSkipTurn.js";

export const ArmyEventHandler = function() {
    this.events = new Map();
    this.mode = ArmyEventHandler.MODE.NONE;
}

ArmyEventHandler.MODE = {
    NONE: 0,
    STORY: 1,
    VERSUS: 2,
    COOP: 3
};

ArmyEventHandler.TYPE = {
    ACTION_REQUEST: 100,
    ACTION_AUTHORIZE: 101,
    ACTION_DENY: 102,

    ENTITY_DEATH: 200,
    ENTITY_DECAY: 201,
    ENTITY_HIT: 202,
    ENTITY_DOWN: 203,
    ENTITY_KILL: 204,
    ENTITY_HEAL: 205,
    ENTITY_SELL: 206,
    ENTITY_MOVE: 207,
    ENTITY_COLLECT: 208,

    TILE_CAPTURE: 300,
    DEBRIS_REMOVED: 301,
    DEBRIS_SPAWN: 302,

    DROP: 400,
    MISSION_COMPLETE: 401,
    MISSION_REWARDS: 402,

    VERSUS_REQUEST_SKIP_TURN: 1000,
    VERSUS_SKIP_TURN: 1001
};

ArmyEventHandler.KILL_REASON = {
    DECAY: "DECAY",
    ATTACK: "ATTACK",
    FIRE_MISSION: "FIRE_MISSION"
};

ArmyEventHandler.prototype.createEvents = function() {
    this.events.set(ArmyEventHandler.TYPE.ACTION_REQUEST, new ActionRequestEvent());
    this.events.set(ArmyEventHandler.TYPE.ACTION_AUTHORIZE, new ActionAuthorizeEvent());
    this.events.set(ArmyEventHandler.TYPE.ACTION_DENY, new ActionDenyEvent());
    
    this.events.set(ArmyEventHandler.TYPE.ENTITY_DEATH, new EntityDeathEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_DECAY, new EntityDecayEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_HIT, new EntityHitEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_DOWN, new EntityDownEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_KILL, new EntityKillEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_HEAL, new EntityHealEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_SELL, new EntitySellEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_MOVE, new EntityMoveEvent());
    this.events.set(ArmyEventHandler.TYPE.ENTITY_COLLECT, new EntityCollectEvent());
    this.events.set(ArmyEventHandler.TYPE.TILE_CAPTURE, new TileCaptureEvent());
    this.events.set(ArmyEventHandler.TYPE.DEBRIS_REMOVED, new DebrisRemovedEvent());
    this.events.set(ArmyEventHandler.TYPE.DEBRIS_SPAWN, new DebrisSpawnEvent());

    this.events.set(ArmyEventHandler.TYPE.DROP, new DropEvent());
    this.events.set(ArmyEventHandler.TYPE.MISSION_COMPLETE, new MissionCompleteEvent());
    this.events.set(ArmyEventHandler.TYPE.MISSION_REWARDS, new MissionRewardsEvent());

    this.events.set(ArmyEventHandler.TYPE.VERSUS_SKIP_TURN, new VersusSkipTurnEvent());
    this.events.set(ArmyEventHandler.TYPE.VERSUS_REQUEST_SKIP_TURN, new VersusRequestSkipTurnEvent());
}

ArmyEventHandler.prototype.addEventExecutor = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.onAnyEvent((eventID, event) => this.executeEvent(gameContext, eventID, event));
}

ArmyEventHandler.prototype.executeEvent = function(gameContext, eventID, event) {
    const eventType = this.events.get(eventID);

    if(!eventType) {
        return;
    }

    console.log(eventType.constructor.name, event);

    switch(this.mode) {
        case ArmyEventHandler.MODE.STORY: {
            eventType.onStory(gameContext, event);
            break;
        }
        case ArmyEventHandler.MODE.VERSUS: {
            eventType.onVersus(gameContext, event);
            break;
        }
        case ArmyEventHandler.MODE.COOP: {
            eventType.onStrike(gameContext, event);
            break;
        }
        default: {
            console.warn(`Mode ${this.mode} is not supported!`);
            break;
        }
    }
}