import { EventEmitter } from "../../events/eventEmitter.js";
import { Logger } from "../../logger.js";
import { Member } from "./member.js";

export const RoomManager = function() {
    this.rooms = new Map();
    this.roomTypes = {};

    this.events = new EventEmitter();
    this.events.listen(RoomManager.EVENT.ROOM_OPENED);
    this.events.listen(RoomManager.EVENT.ROOM_CLOSED);
    this.events.listen(RoomManager.EVENT.CLIENT_JOINED);
    this.events.listen(RoomManager.EVENT.CLIENT_LEFT);
    this.events.listen(RoomManager.EVENT.CLIENT_LEADER);
    this.events.listen(RoomManager.EVENT.MESSAGE_RECEIVED);
    this.events.listen(RoomManager.EVENT.MESSAGE_LOST);
    this.events.listen(RoomManager.EVENT.MESSAGE_SEND);
    this.events.listen(RoomManager.EVENT.MESSAGE_BROADCAST);
}

RoomManager.ID = {
    NEXT: 0
};

RoomManager.EVENT = {
    ROOM_OPENED: "ROOM_OPENED",
    ROOM_CLOSED: "ROOM_CLOSED",
    CLIENT_JOINED: "CLIENT_JOINED",
    CLIENT_LEFT: "CLIENT_LEFT",
    CLIENT_LEADER: "CLIENT_LEADER",
    MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
    MESSAGE_LOST: "MESSAGE_LOST",
    MESSAGE_SEND: "MESSAGE_SEND",
    MESSAGE_BROADCAST: "MESSAGE_BROADCAST"
};

RoomManager.prototype.exit = function() {
    this.rooms.clear();
    RoomManager.ID.NEXT = 0;
}

RoomManager.prototype.getRoom = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return null;
    }

    return room;
}

RoomManager.prototype.registerRoomType = function(typeID, object) {
    if(this.roomTypes[typeID] !== undefined) {
        return false;
    }

    this.roomTypes[typeID] = object;

    return true;
}

RoomManager.prototype.processMessage = function(roomID, messengerID, message) {
    if(!message || !message.type || !message.payload) {
        this.events.emit(RoomManager.EVENT.MESSAGE_LOST, roomID, messengerID, message);

        return false;
    }

    const room = this.rooms.get(roomID);

    if(!room) {
        this.events.emit(RoomManager.EVENT.MESSAGE_LOST, roomID, messengerID, message);

        return false;
    }

    room.processMessage(messengerID, message);

    this.events.emit(RoomManager.EVENT.MESSAGE_RECEIVED, roomID, messengerID, message);

    return true;
}

RoomManager.prototype.createRoom = async function(typeID) {
    const RoomType = this.roomTypes[typeID];

    if(!RoomType) {
        return null;
    }

    const roomID = RoomManager.ID.NEXT++;
    const room = new RoomType(roomID);

    await room.init();
    
    room.onMessageSend = (message, clientID) => this.events.emit(RoomManager.EVENT.MESSAGE_SEND, clientID, message);
    room.onMessageBroadcast = (message) => this.events.emit(RoomManager.EVENT.MESSAGE_BROADCAST, roomID, message);

    this.rooms.set(roomID, room);
    this.events.emit(RoomManager.EVENT.ROOM_OPENED, roomID);
    
    return room;
}

RoomManager.prototype.appointLeader = function(roomID, clientID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.appointLeader", { roomID, clientID });

        return false;
    }

    if(!room.hasMember(clientID)) {
        Logger.log(false, "Client is not in room!", "RoomManager.prototype.appointLeader", { roomID, clientID });

        return false;
    }

    room.setLeader(clientID);

    this.events.emit(RoomManager.EVENT.CLIENT_LEADER, clientID, roomID);

    return true;
}

RoomManager.prototype.canJoin = function(clientID, roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return false;
    }

    return room.canJoin(clientID);
}

RoomManager.prototype.getRoomInformationMessage = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return {
            "id": roomID,
            "members": [],
            "maxMembers": 0
        };
    }

    const members = [];
    const maxClients = room.getMaxMembers();
    const clients = room.getMembers();

    for(const [clientID, client] of clients) {
        const name = client.getName();

        members.push(name);
    }

    return {
        "id": roomID,
        "members": members,
        "maxMembers": maxClients
    };
}

RoomManager.prototype.addClientToRoom = function(clientID, clientName, roomID) {
    if(!this.canJoin(clientID, roomID)) {
        Logger.log(false,  "Room is not joinable!", "RoomManager.prototype.addClientToRoom", { clientID, roomID });

        return false;
    }

    const room = this.rooms.get(roomID);
    const member = new Member(clientID, clientName);

    room.addMember(clientID, member);

    this.events.emit(RoomManager.EVENT.CLIENT_JOINED, clientID, roomID);

    return true;
}

RoomManager.prototype.removeClientFromRoom = function(clientID, roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.removeClientFromRoom", { clientID, roomID });

        return false;
    }

    if(!room.hasMember(clientID)) {
        Logger.log(false, "Client is not in room!", "RoomManager.prototype.removeClientFromRoom", { clientID, roomID });

        return false;
    }

    room.removeMember(clientID);

    this.events.emit(RoomManager.EVENT.CLIENT_LEFT, clientID, roomID);

    if(room.isEmpty()) {
        this.destroyRoom(roomID);

        return true;
    }

    if(!room.hasLeader()) {
        const nextLeader = room.getNextMember();
        this.appointLeader(nextLeader, roomID);
    }

    return true;
}

RoomManager.prototype.destroyRoom = function(roomID) {
    if(!this.rooms.has(roomID)) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.destroyRoom", { roomID });

        return false;
    }

    this.rooms.delete(roomID);
    
    this.events.emit(RoomManager.EVENT.ROOM_CLOSED, roomID);

    if(this.rooms.size === 0) {
        RoomManager.ID.NEXT = 0;
    }

    return true;
}