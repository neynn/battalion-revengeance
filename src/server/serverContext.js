import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { World } from "../../engine/world/world.js";
import { TeamManager } from "../team/teamManager.js";
import { GAME_EVENT, SCHEMA_TYPE } from "../enums.js";
import { ServerMapLoader } from "../systems/map.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { mpIsPlayerIntentValid } from "../action/actionValidator.js";
import { MapSettings } from "../map/settings.js";
import { ServerActionRouter } from "./actionRouter.js";
import { ActionIntent } from "../../engine/action/actionIntent.js";

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

            ServerMapLoader.mpCreateMap(this, this.mapSettings)
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
            const { type, data } = payload;

            if(this.state === ServerGameContext.STATE.STARTED) {
                if(mpIsPlayerIntentValid(this, type, data, messengerID)) {
                    const intent = new ActionIntent(type, data);

                    this.actionRouter.forceEnqueue(this, intent);
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