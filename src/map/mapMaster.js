export const MapMaster = function() {
    this.mapID = null;
    this.slots = [];
    this.maxPlayers = 0;
    this.players = 0;
    this.mode = MapMaster.MODE.PVP;
}

MapMaster.MODE = {
    COOP: 0,
    PVP: 1,
    STORY: 2
};

MapMaster.SLOT_TYPE = {
    CLOSED: 0,
    NPC: 1,
    PLAYER: 2
};

MapMaster.prototype.clear = function() {
    this.mapID = null;
    this.slots.length = 0;
    this.maxPlayers = 0;
    this.players = 0;
}

MapMaster.prototype.createSlot = function(teamID) {
    this.slots.push({
        "clientID": null,
        "teamID": teamID,
        "type": MapMaster.SLOT_TYPE.CLOSED,
        "colorMap": null,
        "name": null
    });
}

MapMaster.prototype.getFreeSlotIndex = function() {
    if(this.players >= this.maxPlayers) {
        return -1;
    }
    
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].type !== MapMaster.SLOT_TYPE.PLAYER) {
            return i;
        }
    }

    return -1;
}

MapMaster.prototype.canStart = function() {
    if(this.slots.length === 0) {
        return false;
    }

    //In PvP, all slots need to be filled by players.
    for(let i = 0; i < this.slots.length; i++) {
        const { type } = this.slots[i];

        if(type !== MapMaster.SLOT_TYPE.PLAYER && this.mode === MapMaster.MODE.PVP) {
            return false; 
        }
    }   

    return true;
}

MapMaster.prototype.addPlayer = function(index, clientID) {
    if(index < 0 || index >= this.slots.length || this.players >= this.maxPlayers) {
        return;
    }

    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            return;
        }
    }

    this.slots[index].clientID = clientID;
    this.slots[index].type = MapMaster.SLOT_TYPE.PLAYER;
    this.slots[index].name = "Player " + index;
    this.players++;
}

MapMaster.prototype.removePlayer = function(clientID) {
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            this.slots[i].clientID = null;
            this.slots[i].type = MapMaster.SLOT_TYPE.CLOSED;
            this.players--;
            break;
        }
    }
}

MapMaster.prototype.getTeamID = function(clientID) {
    //Only applies to PvP for now!!!
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            return this.slots[i].teamID;
        }
    }

    return null;
}

MapMaster.prototype.selectColor = function(clientID, colorMap) {
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            this.slots[i].colorMap = colorMap;
            break;
        }
    }
}