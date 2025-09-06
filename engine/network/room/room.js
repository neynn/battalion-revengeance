export const Room = function(id) {
    this.id = id;
    this.members = new Map();
    this.leaderID = null;
    this.maxClients = 0;
    this.isStarted = false;
}

Room.EVENT_MESSAGE_SEND = 0;
Room.EVENT_MESSAGE_BROADCAST = 1;

Room.prototype.getID = function() {
    return this.id;
}

Room.prototype.isEmpty = function() {
    return this.members.size === 0;
}

Room.prototype.isFull = function() {
    return this.members.size >= this.maxClients;
}

Room.prototype.addMember = function(clientID, client) {
    if(this.members.size >= this.maxClients) {
        return false;
    }

    this.members.set(clientID, client);
    
    return true;
}

Room.prototype.setMaxMembers = function(maxClients) {
    if(maxClients === undefined) {
        return false;
    }

    this.maxClients = maxClients;

    return true;
}

Room.prototype.getMaxMembers = function() {
    return this.maxClients;
}

Room.prototype.hasMember = function(clientID) {
    return this.members.has(clientID);
}

Room.prototype.removeMember = function(clientID) {
    if(!this.members.has(clientID)) {
        return false;
    }

    this.members.delete(clientID);

    return true;
}

Room.prototype.init = async function() {

}

Room.prototype.processMessage = async function(messengerID, message) {

}

Room.prototype.getMembers = function() {
    return this.members;
}

Room.prototype.setLeader = function(leaderID) {
    const client = this.members.get(leaderID);

    if(!client) {
        return false;
    }

    this.leaderID = leaderID;

    return true;
}

Room.prototype.isLeader = function(clientID) {
    return clientID === this.leaderID;
}

Room.prototype.getLeader = function() {
    return this.leaderID;
}

Room.prototype.hasLeader = function() {
    return this.members.has(this.leaderID);
}

Room.prototype.canJoin = function(clientID) {
    if(this.isFull()) {
        return false;
    }

    if(this.members.has(clientID)) {
        return false;
    }

    return true;
}

Room.prototype.getNextMember = function() {
    const iterator = this.members.keys();
    const nextClient = iterator.next().value;

    return nextClient;
}

Room.prototype.onMessageSend = function(message, clientID) {}

Room.prototype.onMessageBroadcast = function(message) {}

Room.prototype.sendMessage = function(message, clientID) {
    if(!message) {
        return false;
    }

    if(clientID && this.members.has(clientID)) {
        this.onMessageSend(message, clientID);
    } else {
        this.onMessageBroadcast(message);
    }

    return true;
}

Room.prototype.start = function() {
    this.isStarted = true;
}

Room.prototype.exit = function() {
    this.isStarted = false;
}