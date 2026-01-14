import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { World } from "../../engine/world/world.js";
import { AttackAction } from "../action/types/attack.js";
import { CaptureAction } from "../action/types/capture.js";
import { CloakAction } from "../action/types/cloak.js";
import { DeathAction } from "../action/types/death.js";
import { EndTurnAction } from "../action/types/endTurn.js";
import { HealAction } from "../action/types/heal.js";
import { MoveAction } from "../action/types/move.js";
import { UncloakAction } from "../action/types/uncloak.js";
import { TeamManager } from "../team/teamManager.js";
import { ServerActionRouter } from "../../engine/router/serverActionRouter.js";
import { ACTION_TYPE, GAME_EVENT, SCHEMA_TYPE } from "../enums.js";
import { ServerMapFactory } from "../systems/map.js";
import { ActionQueue } from "../../engine/action/actionQueue.js";
import { ExplodeTileAction } from "../action/types/explodeTile.js";
import { StartTurnAction } from "../action/types/startTurn.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { EntitySpawnAction } from "../action/types/entitySpawn.js";
import { mpIsPlayerIntentValid } from "../action/actionValidator.js";
import { ExtractAction } from "../action/types/extract.js";
import { PurchaseEntityAction } from "../action/types/purchaseEntity.js";
import { ProduceEntityAction } from "../action/types/produceEntity.js";
import { MapSettings } from "../map/settings.js";

export const ServerGameContext = function(serverApplication, id) {
    Room.call(this, id);

    const { 
        typeRegistry,
        tileManager,
        pathHandler,
        mapRegistry
    } = serverApplication;

    this.pathHandler = pathHandler;
    this.typeRegistry = typeRegistry;
    this.tileManager = tileManager;
    this.mapRegistry = mapRegistry;

    this.world = new World();
    this.teamManager = new TeamManager();
    this.states = new StateMachine(this);
    this.actionRouter = new ServerActionRouter();
    this.mapSettings = new MapSettings();
    this.state = ServerGameContext.STATE.NONE;
    this.readyClients = 0;

    this.world.actionQueue.toFlush();
    this.world.actionQueue.events.on(ActionQueue.EVENT.PLAN_FINISHED, ({ plan }) => this.sendExecutionPlan(plan), { permanent: true });
    this.world.entityManager.nextID = 1000;
}

ServerGameContext.STATE = {
    NONE: 0,
    STARTING: 1,
    STARTED: 2
};

ServerGameContext.prototype = Object.create(Room.prototype);
ServerGameContext.prototype.constructor = ServerGameContext;

ServerGameContext.prototype.onClientJoin = function(clientID) {
    const index = this.mapSettings.getFreePlayerSlotIndex();

    this.mapSettings.addPlayer(index, clientID);
}

ServerGameContext.prototype.onClientLeave = function(clientID) {
    this.mapSettings.removePlayer(clientID);
}

ServerGameContext.prototype.sendEventTrigger = function(eventID) {
    this.broadcastMessage(GAME_EVENT.MP_SERVER_TRIGGER_EVENT, {
        "eventID": eventID
    });
}

ServerGameContext.prototype.sendExecutionPlan = function(plan) {
    this.broadcastMessage(GAME_EVENT.MP_SERVER_EXECUTE_PLAN, {
        "plan": plan.toJSONServer()
    });
}

ServerGameContext.prototype.mpSelectMap = function(mapID) {
    const preview = this.mapRegistry.getMapPreview(mapID);
    const { maxPlayers, teams } = preview;

    this.mapSettings.clear();
    this.mapSettings.mapID = mapID;
    this.mapSettings.maxPlayers = maxPlayers;
    this.mapSettings.createSlots(teams);

    for(let i = 0; i < this.members.length; i++) {
        const member = this.members[i];
        const clientID = member.getID();

        this.mapSettings.addPlayer(i, clientID);
    }
}

ServerGameContext.prototype.processMessage = function(messengerID, message) {
    const { type, payload } = message;

    //Client sends GAME_EVENT.PICK_COLOR
    //mapSettings sets ClientID -> ColorPick
    switch(type) {
        case GAME_EVENT.MP_CLIENT_SELECT_MAP: {

            break;
        }
        case GAME_EVENT.MP_CLIENT_START_MATCH: {
            if(!this.isLeader(messengerID) || this.state !== ServerGameContext.STATE.NONE) {
                return;
            }


            //Done in MP_CLIENT_SELECT_MAP!!!
            this.mpSelectMap("volcano");

            if(!this.mapSettings.canStart()) {
                console.error("Map could not start!");
                return;
            }

            this.state = ServerGameContext.STATE.STARTING;
            this.mapSettings.selectColor(messengerID, SCHEMA_TYPE.CREAM);
            this.mapSettings.lockSlots();

            ServerMapFactory.mpCreateMap(this, this.mapSettings)
            .then(() => {
                const settings = this.mapSettings.toJSON();

                for(let i = 0; i < this.members.length; i++) {
                    const memberID = this.members[i].getID();
                    const teamID = this.mapSettings.getTeamID(memberID);

                    this.sendMessage(GAME_EVENT.MP_SERVER_LOAD_MAP, {
                        "settings": settings,
                        "client": teamID,
                        "isSpectator": (teamID === null)
                    }, memberID);
                }
            });

            break;
        }
        case GAME_EVENT.MP_CLIENT_MAP_LOADED: {
            this.readyClients++;

            if(this.readyClients >= this.members.length && this.state === ServerGameContext.STATE.STARTING) {
                this.broadcastMessage(GAME_EVENT.MP_SERVER_START_MAP, {});
                this.actionRouter.forceEnqueue(this, createStartTurnIntent());
                this.state = ServerGameContext.STATE.STARTED;
            }

            break;
        }
        case GAME_EVENT.MP_CLIENT_ACTION_INTENT: {
            const { intent } = payload;

            if(this.state === ServerGameContext.STATE.STARTED) {
                if(mpIsPlayerIntentValid(this, intent, messengerID)) {
                    this.actionRouter.onPlayerIntent(this, intent);
                }
            }

            break;
        }
        default: {
            console.error("Unsupported event!");
            break;
        }
    }
}

ServerGameContext.prototype.init = function() {
    this.world.actionQueue.registerAction(ACTION_TYPE.PRODUCE_ENTITY, new ProduceEntityAction(true));
    this.world.actionQueue.registerAction(ACTION_TYPE.PURCHASE_ENTITY, new PurchaseEntityAction(true));
    this.world.actionQueue.registerAction(ACTION_TYPE.EXTRACT, new ExtractAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.ENTITY_SPAWN, new EntitySpawnAction(true));
    this.world.actionQueue.registerAction(ACTION_TYPE.START_TURN, new StartTurnAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CAPTURE, new CaptureAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.DEATH, new DeathAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.UNCLOAK, new UncloakAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.END_TURN, new EndTurnAction());
}