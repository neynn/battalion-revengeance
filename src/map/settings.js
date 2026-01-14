export const MapSettings = function() {
    this.mapID = null;
    this.colors = {};
    this.allies = {};
    this.entities = [];

    this.slots = [];
    this.maxPlayers = 0;
    this.players = 0;
    this.mode = MapSettings.MODE.PVP;
}

MapSettings.MODE = {
    COOP: 0,
    PVP: 1,
    STORY: 2
};

MapSettings.SLOT_TYPE = {
    CLOSED: 0,
    NPC: 1,
    PLAYER: 2
};

MapSettings.prototype.canStart = function() {
    if(this.slots.length === 0) {
        return false;
    }

    //In PvP, all slots need to be filled by players.
    for(let i = 0; i < this.slots.length; i++) {
        const { type } = this.slots[i];

        if(type !== MapSettings.SLOT_TYPE.PLAYER && this.mode === MapSettings.MODE.PVP) {
            return false; 
        }
    }   

    return true;
}

MapSettings.prototype.removePlayer = function(clientID) {
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            this.slots[i].clientID = null;
            this.slots[i].type = MapSettings.SLOT_TYPE.CLOSED;
            this.players--;
            break;
        }
    }
}

MapSettings.prototype.getFreePlayerSlotIndex = function() {
    if(this.players >= this.maxPlayers) {
        return -1;
    }
    
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].type !== MapSettings.SLOT_TYPE.PLAYER) {
            return i;
        }
    }

    return -1;
}

MapSettings.prototype.clear = function() {
    this.mapID = null;
    this.maxPlayers = 0;
    this.slots.length = 0;
    this.entities.length = 0;
    this.players = 0;
    this.allies = {};
    this.colors = {};
}

MapSettings.prototype.getTeamID = function(clientID) {
    //Only applies to PvP for now!!!
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            return this.slots[i].teamID;
        }
    }

    return null;
}

MapSettings.prototype.addPlayer = function(index, clientID) {
    if(index < 0 || index >= this.slots.length || this.players >= this.maxPlayers) {
        return;
    }

    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            return;
        }
    }

    this.slots[index].clientID = clientID;
    this.slots[index].type = MapSettings.SLOT_TYPE.PLAYER;
    this.players++;
}

MapSettings.prototype.createSlots = function(teams) {
    for(let i = 0; i < teams.length; i++) {
        this.slots.push({
            "clientID": null,
            "teamID": teams[i],
            "color": null,
            "type": MapSettings.SLOT_TYPE.CLOSED
        });
    }
}

MapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MapSettings.prototype.lockSlots = function() {
    for(let i = 0; i < this.slots.length; i++) {
        const { teamID, colorID } = this.slots[i];

        if(colorID !== null) {
            this.colors[teamID] = colorID;
        }
    } 
}

MapSettings.prototype.toJSON = function() {
    return {
        "mapID": this.mapID,
        "colors": this.colors,
        "allies": this.allies,
        "entities": this.entities,
        "mode": this.mode
    }
}

MapSettings.prototype.setAllies = function(teamID, allies) {
    this.allies[teamID] = allies;
}

MapSettings.prototype.selectColor = function(clientID, colorID) {
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            this.slots[i].colorID = colorID;
            break;
        }
    }
}