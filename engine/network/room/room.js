export const Room = function(id) {
    this.id = id;
    this.members = [];
    this.leaderID = null;
    this.maxClients = 0;
    this.isStarted = false;
}

Room.prototype.processMessage = async function(messengerID, message) {}
Room.prototype.onMessageSend = function(message, clientID) {}
Room.prototype.onMessageBroadcast = function(message) {}

Room.prototype.getID = function() {
    return this.id;
}

Room.prototype.isEmpty = function() {
    return this.members.length === 0;
}

Room.prototype.isFull = function() {
    return this.members.length >= this.maxClients;
}

Room.prototype.addMember = function(client) {
    if(this.members.length >= this.maxClients) {
        return false;
    }

    this.members.push(client);
    
    return true;
}

Room.prototype.setMaxMembers = function(maxClients) {
    if(maxClients === undefined) {
        return false;
    }

    this.maxClients = maxClients;

    return true;
}

Room.prototype.hasMember = function(clientID) {
    for(let i = 0; i < this.members.length; i++) {
        const member = this.members[i];

        if(member.getID() === clientID) {
            return true;
        }
    }

    return false;
}

Room.prototype.getMember = function(clientID) {
    for(let i = 0; i < this.members.length; i++) {
        const member = this.members[i];

        if(member.getID() === clientID) {
            return member;
        }
    }

    return null;
}

Room.prototype.removeMember = function(clientID) {
    for(let i = 0; i < this.members.length; i++) {
        const member = this.members[i];

        if(member.getID() === clientID) {
            this.members[i] = this.members[this.members.length - 1];
            this.members.pop();
            break;
        }
    }
}

Room.prototype.setLeader = function(clientID) {
    const client = this.getMember(clientID);

    if(!client) {
        return false;
    }

    this.leaderID = clientID;

    return true;
}

Room.prototype.isLeader = function(clientID) {
    return clientID === this.leaderID;
}

Room.prototype.getLeader = function() {
    const leader = this.getMember(this.leaderID);

    if(!leader) {
        return null;
    }

    return leader;
}

Room.prototype.hasLeader = function() {
    return this.hasMember(this.leaderID);
}

Room.prototype.canJoin = function(clientID) {
    if(this.isFull()) {
        return false;
    }

    if(this.hasMember(clientID)) {
        return false;
    }

    return true;
}

Room.prototype.appointNextLeader = function() {
    if(this.members.length === 0) {
        return false;
    }

    this.leaderID = this.members[0].getID();

    return true;
}

Room.prototype.sendMessage = function(message, clientID) {
    if(!message) {
        return false;
    }

    if(clientID && this.hasMember(clientID)) {
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