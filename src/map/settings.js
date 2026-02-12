export const MapSettings = function() {
    this.mapID = null;
    this.entities = [];
    this.overrides = [];
    this.slots = [];
    this.maxPlayers = 0;
    this.players = 0;
    this.mode = MapSettings.MODE.PVP;
}

MapSettings.MISSING_OVERRIDE = {
    "teamID": null,
    "color": null,
    "name": null,
    "allies": []
};

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

MapSettings.prototype.getFreeSlotIndex = function() {
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
    this.overrides.length = 0;
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
    this.slots[index].name = "Player " + index; //TODO: Add real name.
    this.players++;
}

MapSettings.prototype.createSlots = function(teams) {
    for(let i = 0; i < teams.length; i++) {
        this.slots.push({
            "clientID": null,
            "teamID": teams[i],
            "type": MapSettings.SLOT_TYPE.CLOSED,
            "color": null,
            "name": null
        });

        this.overrides.push({
            "teamID": teams[i],
            "allies": [],
            "color": null,
            "name": null
        });
    }
}

MapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MapSettings.prototype.getOverride = function(teamID) {
    for(let i = 0; i < this.overrides.length; i++) {
        if(this.overrides[i].teamID === teamID) {
            return this.overrides[i];
        }
    }

    return MapSettings.MISSING_OVERRIDE;
}

MapSettings.prototype.updateOverrides = function() {
    for(let i = 0; i < this.slots.length; i++) {
        const { colorID, name } = this.slots[i];
        const override = this.overrides[i];

        if(colorID !== null) {
            override.color = colorID;
        }

        if(name !== null) {
            override.name = name;
        }
    } 
}

MapSettings.prototype.fromJSON = function(json) {
    const { mapID, entities, mode, overrides } = json;

    this.mapID = mapID;
    this.entities = entities;
    this.mode = mode;
    this.overrides = overrides;

}

MapSettings.prototype.toJSON = function() {
    return {
        "mapID": this.mapID,
        "entities": this.entities,
        "mode": this.mode,
        "overrides": this.overrides
    }
}

MapSettings.prototype.selectColor = function(clientID, colorID) {
    for(let i = 0; i < this.slots.length; i++) {
        if(this.slots[i].clientID === clientID) {
            this.slots[i].colorID = colorID;
            break;
        }
    }
}