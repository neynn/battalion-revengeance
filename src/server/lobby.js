import { MAX_TEAMS } from "../constants";
import { SCHEMA_TYPE } from "../enums.js";

const isColorCustom = function(colorID) {
    return colorID >= SCHEMA_TYPE.CUSTOM_1 && colorID <= SCHEMA_TYPE.CUSTOM_8;
} 

const LobbySlot = function() {
    this.type = LobbySlot.TYPE.EMPTY;
    this.colorID = SCHEMA_TYPE.RED;
    this.isReady = false;
    this.clientID = null;
}

LobbySlot.TYPE = {
    EMPTY: 0,
    CPU: 1,
    PLAYER: 2
};

LobbySlot.prototype.isReady = function() {
    if(this.type === LobbySlot.TYPE.EMPTY) {
        return false;
    }

    if(this.type === LobbySlot.TYPE.PLAYER && !this.isReady) {
        return false;
    }

    return true;
}

export const Lobby = function() {
    this.scenarioID = null;
    this.maxPlayers = 0;
    this.minPlayers = 0;
    this.playerCount = 0;
    this.usedSlots = 0;
    this.slots = [];

    for(let i = 0; i < MAX_TEAMS; i++) {
        this.slots[i] = new LobbySlot();
    }
}

Lobby.prototype.hasEnoughPlayers = function() {
    return this.playerCount >= this.minPlayers && this.playerCount <= this.maxPlayers;
}

Lobby.prototype.isAllowedToStart = function() {
    if(!this.hasEnoughPlayers()) {
        return false;
    }

    for(let i = 0; i < this.usedSlots; i++) {
        if(!this.slots[i].isReady()) {
            return false;
        }
    }

    return true;
}

Lobby.prototype.findByClient = function(clientID) {
    for(let i = 0; i < this.usedSlots; i++) {
        if(this.slots[i].clientID === clientID) {
            return i;
        }
    }

    return -1;
}

Lobby.prototype.loadScenario = function(gameContext, scenarioID) {
    const { scenarioRegistry } = gameContext;
    const scenario = scenarioRegistry.getScenario(scenarioID);

    if(!scenario) {
        console.warn("Scenario does not exist!");
        return false;
    }

    const { minPlayers, maxPlayers, teams } = scenario;

    this.slots.length = 0;
    this.scenarioID = scenarioID;
    this.minPlayers = minPlayers;
    this.maxPlayer = maxPlayers;
    this.usedSlots = teams.length;
    this.playerCount = 0;

    for(const team of teams) {
        const slot = new LobbySlot();

        this.slots.push(slot);
    }
}

Lobby.prototype.selectColor = function(clientID, colorID) {
    const slotIndex = this.findByClient(clientID);

    //Bug-prevention
    if(slotIndex === -1) {
        return false;
    }

    
}

//host picks scenario -> lobby from that.
//create custom game -> select mode -> room created.

//A few rules: No slot is allowed to be empty
//concept of a room is different than a lobby.
//rooms are dictated by the server, lobbies by the players.
//If the server has no more open rooms, then the player cannot open one.
//-> players do not create rooms, they request them.

//Maps CANNOT be changed after a lobby is created.
//If all players leave then the lobby dissolves.