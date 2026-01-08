import { EventEmitter } from "../../events/eventEmitter.js";

export const RoomManager = function() {
    this.nextID = 0;
    this.rooms = new Map();

    this.events = new EventEmitter();
    this.events.register(RoomManager.EVENT.ROOM_OPENED);
    this.events.register(RoomManager.EVENT.ROOM_CLOSED);
    this.events.register(RoomManager.EVENT.MESSAGE_RECEIVED);
    this.events.register(RoomManager.EVENT.MESSAGE_LOST);
    this.events.register(RoomManager.EVENT.MESSAGE_SEND);
    this.events.register(RoomManager.EVENT.MESSAGE_BROADCAST);
}

RoomManager.INVALID_ID = -1;

RoomManager.EVENT = {
    ROOM_OPENED: "ROOM_OPENED",
    ROOM_CLOSED: "ROOM_CLOSED",
    MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
    MESSAGE_LOST: "MESSAGE_LOST",
    MESSAGE_SEND: "MESSAGE_SEND",
    MESSAGE_BROADCAST: "MESSAGE_BROADCAST"
};

RoomManager.prototype.exit = function() {
    this.rooms.clear();
    this.nextID = 0;
}

RoomManager.prototype.getRoom = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return null;
    }

    return room;
}

RoomManager.prototype.getNextID = function() {
    return this.nextID++;
} 

RoomManager.prototype.processMessage = function(roomID, messengerID, message) {
    const room = this.rooms.get(roomID);

    if(!room || typeof message !== "object") {
        this.events.emit(RoomManager.EVENT.MESSAGE_LOST, {
            "roomID": roomID,
            "messengerID": messengerID,
            "message": message
        });

        return false;
    }

    room.processMessage(messengerID, message);

    this.events.emit(RoomManager.EVENT.MESSAGE_RECEIVED, {
        "roomID": roomID,
        "messengerID": messengerID,
        "message": message
    });

    return true;
}

RoomManager.prototype.addRoom = function(room) {
    const roomID = room.getID();

    if(!this.rooms.has(roomID)) {
        room.onMessageSend = (message, clientID) => this.events.emit(RoomManager.EVENT.MESSAGE_SEND, {
            "clientID": clientID,
            "message": message
        });

        room.onMessageBroadcast = (message) => this.events.emit(RoomManager.EVENT.MESSAGE_BROADCAST, {
            "roomID": roomID,
            "message": message
        });

        this.rooms.set(roomID, room);
        this.events.emit(RoomManager.EVENT.ROOM_OPENED, {
            "id": roomID
        });
    }
}

RoomManager.prototype.getRoomInformationMessage = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return {
            "id": roomID,
            "members": [],
            "maxMembers": 0,
            "leader": ""
        };
    }

    const { maxClients, members } = room;
    const clients = [];
    const leader = room.getLeader();
    const leaderName = leader !== null ? leader.getUserID() : "";

    members.forEach(member => clients.push(member.getUserID()));

    return {
        "id": roomID,
        "members": clients,
        "maxMembers": maxClients,
        "leader": leaderName
    };
}

RoomManager.prototype.destroyRoom = function(roomID) {
    if(!this.rooms.has(roomID)) {
        console.error("Room does not exist!");
        return false;
    }

    this.rooms.delete(roomID);
    this.events.emit(RoomManager.EVENT.ROOM_CLOSED, {
        "id": roomID
    });

    if(this.rooms.size === 0) {
        this.nextID = 0;
    }

    return true;
}