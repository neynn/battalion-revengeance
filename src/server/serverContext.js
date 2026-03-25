import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { World } from "../../engine/world/world.js";
import { TeamManager } from "../team/teamManager.js";
import { GAME_EVENT } from "../enums.js";
import { createServerMapLoader } from "../systems/map.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { mpIsPlayerIntentValid } from "../action/actionValidator.js";
import { ServerActionRouter } from "./actionRouter.js";
import { ActionIntent } from "../../engine/action/actionIntent.js";
import { MapMaster } from "../map/mapMaster.js";
import { getTurnData } from "../systems/save.js";

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
    this.mapMaster = new MapMaster();
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
    const index = this.mapMaster.getFreeSlotIndex();

    this.mapMaster.addPlayer(index, clientID);
}

ServerGameContext.prototype.onClientLeave = function(clientID) {
    this.mapMaster.removePlayer(clientID);
}

ServerGameContext.prototype.mpSelectMap = function(mapID) {
    const preview = this.mapRegistry.getMapPreview(mapID);
    const { maxPlayers, teams } = preview;

    this.mapMaster.clear();
    this.mapMaster.maxPlayers = maxPlayers;
    this.mapMaster.mapID = mapID;

    for(const teamID of teams) {
        this.mapMaster.createSlot(teamID);
    }

    for(let i = 0; i < this.members.length; i++) {
        const member = this.members[i];
        const clientID = member.getID();

        this.mapMaster.addPlayer(i, clientID);
    }
}

ServerGameContext.prototype.createInitialSnapshot = function() {
    const { world, teamManager } = this;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const entities = [];
    const teams = [];

    entityManager.forEachEntity((entity) => {
        entities.push({
            "id": entity.getID(),
            "data": entity.save()
        });
    });

    teamManager.forEachTeam((team) => teams.push(team.save()));

    return {
        "mapID": worldMap.sourceID,
        "turn": getTurnData(this),
        "entities": entities,
        "teams": teams
    };
}

ServerGameContext.prototype.createRejoinSnapshot = function() {

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

            if(!this.mapMaster.canStart()) {
                console.error("Map could not start!");
                return;
            }

            this.state = ServerGameContext.STATE.STARTING;
            this.mapMaster.selectColor(messengerID, {
                "0x661A5E": [105, 125, 108],
                "0xAA162C": [197, 171, 159],
                "0xE9332E": [66, 65, 68],
                "0xFF9085": [71, 75, 136]
            });

            const sourceID = this.mapMaster.mapID;
            const overrides = this.mapMaster.createOverrides();

            createServerMapLoader(this, sourceID)
            .then((mapLoader) => {
                if(mapLoader) {
                    mapLoader.loadMap(this, overrides);

                    const snapshot = this.createInitialSnapshot();

                    for(let i = 0; i < this.members.length; i++) {
                        const memberID = this.members[i].getID();
                        const teamID = this.mapMaster.getTeamID(memberID);

                        this.sendMessage(GAME_EVENT.MP_SERVER_LOAD_MAP, {
                            "snapshot": snapshot,
                            "client": teamID,
                            "overrides": overrides
                        }, memberID);
                    }
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