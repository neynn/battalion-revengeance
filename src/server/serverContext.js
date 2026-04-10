import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { World } from "../../engine/world/world.js";
import { TeamManager } from "../team/teamManager.js";
import { GAME_EVENT } from "../enums.js";
import { createServerMapLoader } from "../systems/map.js";
import { createStartTurnIntent } from "../action/actionHelper.js";
import { MapMaster } from "../map/mapMaster.js";
import { ServerActionRouter } from "../action/router/serverActionRouter.js";
import { isIntentValid, unpackIntent } from "../action/intentPacker.js";
import { ENTITY_SNAPSHOT_SIZE, packEntitySnapshot } from "../action/packer_constants.js";
import { fillTurnSnapshot } from "../snapshot/turnSnapshot.js";

const isClientTurn = function(gameContext, messengerID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { currentActor } = turnManager;

    if(!currentActor) {
        return false;
    }

    return currentActor.clientID === messengerID;
}

export const ServerGameContext = function(serverApplication, id) {
    Room.call(this, serverApplication, id);

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

ServerGameContext.prototype.createTotalEntityBuffer = function() {
    const entities = this.world.entityManager.entities;
    const BUFFER_SIZE = 2 + (2 + ENTITY_SNAPSHOT_SIZE) * entities.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint16(0, entities.length, true);

    let byteOffset = 2;

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const entityID = entity.getID();
        const snapshot = entity.save();

        view.setInt16(byteOffset, entityID, true);
        byteOffset = packEntitySnapshot(snapshot, view, byteOffset + 2);
    }

    return buffer;
}

ServerGameContext.prototype.createInitialSnapshot = function(mapID) {
    const { teamManager } = this;
    const teams = [];

    teamManager.forEachTeam((team) => teams.push(team.save()));

    return {
        "mapID": mapID,
        "turn": fillTurnSnapshot(this),
        "entities": this.createTotalEntityBuffer(),
        "teams": teams
    }
}

ServerGameContext.prototype.createRejoinSnapshot = function() {

}

ServerGameContext.prototype.onMessage = async function(messengerID, type, payload) {
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
            .then((loader) => {
                loader.loadMap(this, overrides);

                const snapshot = this.createInitialSnapshot(sourceID);

                for(let i = 0; i < this.members.length; i++) {
                    const memberID = this.members[i].getID();
                    const teamID = this.mapMaster.getTeamID(memberID);

                    this.send(GAME_EVENT.MP_SERVER_LOAD_MAP, {
                        "snapshot": snapshot,
                        "client": teamID,
                        "overrides": overrides
                    }, memberID);
                }
            })
            .catch(() => {

            });

            break;
        }
        case GAME_EVENT.MP_CLIENT_MAP_LOADED: {
            this.readyClients++;

            if(this.readyClients >= this.members.length && this.state === ServerGameContext.STATE.STARTING) {
                this.broadcast(GAME_EVENT.MP_SERVER_START_MAP, 0);
                this.actionRouter.forceEnqueue(this, createStartTurnIntent());
                this.state = ServerGameContext.STATE.STARTED;
            }

            break;
        }
        case GAME_EVENT.MP_CLIENT_ACTION_INTENT: {
            if(this.state === ServerGameContext.STATE.STARTED && isClientTurn(this, messengerID)) {
                const arrayBuffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
                const intent = unpackIntent(arrayBuffer);

                if(intent && isIntentValid(this, intent)) {
                    console.log("RECEIVED BYTES:", arrayBuffer.byteLength);

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