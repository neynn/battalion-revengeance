import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { TurnManager } from "../../engine/world/turn/turnManager.js";
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
import { TypeRegistry } from "../type/typeRegistry.js";
import { ServerActionRouter } from "../../engine/router/serverActionRouter.js";
import { GAME_EVENT } from "../enums.js";
import { createPvPServerMap } from "../systems/map.js";
import { ActionQueue } from "../../engine/action/actionQueue.js";
import { WorldEventHandler } from "../../engine/world/event/worldEventHandler.js";
import { ExplodeTileAction } from "../action/types/explodeTile.js";

export const ServerGameContext = function(serverApplication, id) {
    Room.call(this, id);

    const { 
        typeRegistry,
        tileManager,
        pathHandler,
        mapRepository
    } = serverApplication;

    this.pathHandler = pathHandler;
    this.typeRegistry = typeRegistry;
    this.tileManager = tileManager;
    this.mapRepository = mapRepository;

    this.world = new World();
    this.teamManager = new TeamManager();
    this.states = new StateMachine(this);
    this.actionRouter = new ServerActionRouter();
    this.readyClients = 0;

    this.world.actionQueue.toFlush();
    this.world.actionQueue.events.on(ActionQueue.EVENT.PLAN_FINISHED, ({ plan }) => this.sendExecutionPlan(plan), { permanent: true });
    this.world.eventHandler.events.on(WorldEventHandler.EVENT.WORLD_EVENT_TRIGGERED, ({ id }) => this.sendEventTrigger(id));
}

ServerGameContext.prototype = Object.create(Room.prototype);
ServerGameContext.prototype.constructor = ServerGameContext;

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

ServerGameContext.prototype.processMessage = function(messengerID, message) {
    const { type, payload } = message;

    switch(type) {
        case GAME_EVENT.MP_CLIENT_START_MATCH: {
            createPvPServerMap(this, "presus")
            .then(() => {
                for(let i = 0; i < this.members.length; i++) {
                    const member = this.members[i];
                    const memberID = member.getID()

                    this.sendMessage(GAME_EVENT.MP_SERVER_LOAD_MAP, {
                        "mapID": "presus",
                        "client": this.teamManager.activeTeams[i] //HACKY!
                    }, memberID);
                }
            });

            break;
        }
        case GAME_EVENT.MP_CLIENT_MAP_LOADED: {
            this.readyClients++;

            if(this.readyClients >= this.members.length && !this.isStarted) {
                this.broadcastMessage(GAME_EVENT.MP_SERVER_START_MAP, {});
                this.isStarted = true;
                this.world.turnManager.getNextActor(this);
            }

            break;
        }
        case GAME_EVENT.MP_CLIENT_ACTION_INTENT: {
            const { intent } = payload;

            if(this.isStarted) {
                this.actionRouter.onPlayerIntent(this, messengerID, intent);
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
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.EXPLODE_TILE, new ExplodeTileAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CAPTURE, new CaptureAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.HEAL, new HealAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DEATH, new DeathAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.UNCLOAK, new UncloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.END_TURN, new EndTurnAction());

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_TURN, ({ turn }) => {
        this.world.eventHandler.onTurnChange(this, turn);
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_ROUND, ({ round }) => {
        this.world.eventHandler.onRoundChange(this, round);
    }, { permanent: true });
}

