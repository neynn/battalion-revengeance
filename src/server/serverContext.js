import { Room } from "../../engine/network/room/room.js";
import { StateMachine } from "../../engine/state/stateMachine.js";
import { World } from "../../engine/world/world.js";
import { TeamManager } from "../team/teamManager.js";
import { MP_CLIENT_JSON, INTERRUPT_TYPE, MP_SERVER_JSON } from "../enums.js";
import { MapMaster } from "../map/mapMaster.js";
import { ServerActionRouter } from "../action/router/serverActionRouter.js";
import { isIntentValid, unpackIntent } from "../action/intentPacker.js";
import { ENTITY_SNAPSHOT_SIZE, packEntitySnapshot } from "../action/packer_constants.js";
import { fillTurnSnapshot } from "../snapshot/turnSnapshot.js";
import { InterruptVTable } from "../action/types/interrupt.js";
import { loadServerScenario } from "../systems/map.js";
import { Lobby } from "./lobby.js";

const isClientTurn = function(gameContext, messengerID) {
    const { world } = gameContext;
    const { actorManager } = world;
    const { currentActor } = actorManager;

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
        mapRegistry,
        scenarioRegistry
    } = serverApplication;

    this.pathHandler = pathHandler;
    this.typeRegistry = typeRegistry;
    this.tileManager = tileManager;
    this.mapRegistry = mapRegistry;
    this.scenarioRegistry = scenarioRegistry;

    this.world = new World();
    this.teamManager = new TeamManager();
    this.states = new StateMachine(this);
    this.actionRouter = new ServerActionRouter();
    this.mapMaster = new MapMaster();
    this.lobby = new Lobby();
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

ServerGameContext.prototype.selectScenario = function(scenarioID) {
    const scenario = this.scenarioRegistry.getScenario(scenarioID);

    if(!scenario) {
        console.warn("Scenario does not exist!");

        return false;
    }

    const { maxPlayers, teams } = scenario;

    this.mapMaster.clear();
    this.mapMaster.maxPlayers = maxPlayers;
    this.mapMaster.scenarioID = scenarioID;
    this.mapMaster.createSlots(teams);

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

ServerGameContext.prototype.createInitialSnapshot = function() {
    const { teamManager } = this;
    const teams = [];

    teamManager.forEachTeam((team) => teams.push(team.save()));

    return {
        "turn": fillTurnSnapshot(this),
        "entities": this.createTotalEntityBuffer(),
        "teams": teams
    }
}

ServerGameContext.prototype.createRejoinSnapshot = function() {

}

ServerGameContext.prototype.onMessage = async function(messengerID, type, payload) {
    //Client sends MP_CLIENT_JSON.PICK_COLOR
    //mapSettings sets ClientID -> ColorPick
    switch(type) {
        case MP_CLIENT_JSON.SELECT_SCENARIO: {

            break;
        }
        case MP_CLIENT_JSON.SELECT_COLOR: {
            const { colorID } = payload;

            this.mapMaster.selectColor(messengerID, colorID);
            //Ask the MapMaster to select the color
            break;
        }
        case MP_CLIENT_JSON.START_MATCH: {
            if(!this.isLeader(messengerID) || this.state !== ServerGameContext.STATE.NONE) {
                return;
            }

            //Done in MP_CLIENT_SELECT_SCENARIO!!!
            this.selectScenario("PVP_VOLCANO");

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

            const scenarioID = this.mapMaster.scenarioID;
            const overrides = this.mapMaster.createOverrides();

            loadServerScenario(this, scenarioID)
            .then(loader => {
                loader.loadMap(this, overrides);

                const snapshot = this.createInitialSnapshot();

                for(let i = 0; i < this.members.length; i++) {
                    const memberID = this.members[i].getID();
                    const teamID = this.mapMaster.getTeamID(memberID);

                    this.send(MP_SERVER_JSON.LOAD_MAP, {
                        "scenario": scenarioID,
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
        case MP_CLIENT_JSON.MAP_LOADED: {
            this.readyClients++;

            if(this.readyClients >= this.members.length && this.state === ServerGameContext.STATE.STARTING) {
                this.broadcast(MP_SERVER_JSON.START_MAP, 0);
                this.state = ServerGameContext.STATE.STARTED;
                this.actionRouter.forceEnqueue(this, InterruptVTable.createIntent(INTERRUPT_TYPE.START_GAME, -1));
            }

            break;
        }
        case MP_CLIENT_JSON.ACTION_INTENT: {
            if(this.state === ServerGameContext.STATE.STARTED && isClientTurn(this, messengerID)) {
                const arrayBuffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);

                console.log("RECEIVED BYTES:", arrayBuffer.byteLength);

                const intent = unpackIntent(arrayBuffer);

                if(intent) {
                    if(isIntentValid(this, intent)) {
                        this.actionRouter.forceEnqueue(this, intent);
                    } else {
                        console.error("Invalid ActionIntent!");
                    }
                } else {
                    console.error("ActionIntent is not supported!");
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