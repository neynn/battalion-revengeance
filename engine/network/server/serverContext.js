import { NETWORK_EVENTS, ROOM_EVENTS } from "../events.js";
import { RoomManager } from "../room/roomManager.js";
import { ClientManager } from "../client/clientManager.js";
import { EventEmitter } from "../../events/eventEmitter.js";
import { Logger } from "../../logger.js";

export const ServerContext = function(io) {
    this.io = io;
    this.io.on('connection', (socket) => this.handleConnect(socket));

    this.roomManager = new RoomManager();
    this.clientManager = new ClientManager();

    this.events = new EventEmitter();
    this.events.listen(ServerContext.EVENT.CONNECT);
    this.events.listen(ServerContext.EVENT.DISCONNECT);

    this.events.on(ServerContext.EVENT.CONNECT, (socket) => console.log(`${socket.id} has connected to the server!`), { permanent: true });
    this.events.on(ServerContext.EVENT.DISCONNECT, (clientID) => console.log(`${clientID} has disconnected from the server!`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.ROOM_OPENED, (roomID) => console.log(`Room ${roomID} has been opened!`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.ROOM_CLOSED, (roomID) => console.log(`Room ${roomID} has been closed!`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.CLIENT_JOINED, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.CLIENT_LEFT, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.CLIENT_LEADER, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_RECEIVED, (roomID, messengerID, message) => console.log(`Message received! ${roomID, messengerID}`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_LOST, (roomID, messengerID, message) => `Message lost! ${roomID, messengerID}`, { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_SEND, (clientID, message) => this.io.to(clientID).emit(NETWORK_EVENTS.MESSAGE, message), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_BROADCAST, (roomID, message) => this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message), { permanent: true });
    this.clientManager.events.on(ClientManager.EVENT.CLIENT_CREATE, (clientID) => console.log(`${clientID} has been created!`), { permanent: true });
    this.clientManager.events.on(ClientManager.EVENT.CLIENT_DELETE, (clientID) => console.log(`${clientID} has been removed!`), { permanent: true });
    this.clientManager.events.on(ClientManager.EVENT.USER_ID_ADDED, (clientID, userID) => console.log(`${clientID} is now named ${userID}!`), { permanent: true });
}

ServerContext.EVENT = {
    "CONNECT": "CONNECT",
    "DISCONNECT": "DISCONNECT"
}

ServerContext.prototype.sendRoomUpdate = function(clientID, roomID) {
    const information = this.roomManager.getRoomInformationMessage(roomID);
    const message = { "type": ROOM_EVENTS.ROOM_UPDATE, "payload": information };

    this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message);

    console.log(`${clientID} left room ${roomID}`);
}

ServerContext.prototype.handleConnect = function(socket) {
    this.registerNetworkEvents(socket);
    this.clientManager.createClient(socket);
    this.events.emit(ServerContext.EVENT.CONNECT, socket);
}

ServerContext.prototype.handleDisconnect = function(clientID) {
    this.handleRoomLeave(clientID);
    this.clientManager.destroyClient(clientID);
    this.events.emit(ServerContext.EVENT.DISCONNECT, clientID);
}

ServerContext.prototype.handleRoomLeave = function(clientID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.LEAVE_ROOM_REQUEST", { clientID });
        return false;
    }

    const roomID = client.getRoomID();

    if(roomID === null) {
        Logger.log(false, "Client is not in a room!", "NETWORK_EVENTS.LEAVE_ROOM_REQUEST", { clientID, roomID });
        return false;
    }

    client.leaveRoom();

    this.roomManager.removeClientFromRoom(clientID, roomID);

    return true;
}

ServerContext.prototype.handleRegister = function(clientID, data) {
    this.clientManager.addUserID(clientID, data["user-id"]);

    return true;
}

ServerContext.prototype.handleRoomCreate = async function(clientID, roomType) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", null, { clientID });
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== null) {
        Logger.log(false, "Client is already in room!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", { clientID, clientRoomID });
        return false;
    }

    const room = await this.roomManager.createRoom(roomType);

    if(!room) {
        Logger.log(false, "Room was not created!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", { roomType });
        return false;
    }

    const roomID = room.getID();
    const isJoinable = this.roomManager.canJoin(clientID, roomID);

    if(!isJoinable) {
        Logger.log(false, "Room is not joinable!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", null);

        return false;
    }

    const userID = client.getUserID();

    client.joinRoom(roomID);

    this.roomManager.addClientToRoom(clientID, userID, roomID);
    this.roomManager.appointLeader(roomID, clientID);

    return true;
}

ServerContext.prototype.handleRoomJoin = function(clientID, roomID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID });
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== null) {
        Logger.log(false, "Client is already in room!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID, clientRoomID});
        return false;
    }

    const isJoinable = this.roomManager.canJoin(clientID, roomID);

    if(!isJoinable) {
        Logger.log(false, "Room is not joinable!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID, roomID });
        return false;
    }

    const userID = client.getUserID();

    client.joinRoom(roomID);

    this.roomManager.addClientToRoom(clientID, userID, roomID);

    return true;
}

ServerContext.prototype.handleRoomMessage = function(clientID, message) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.MESSAGE_ROOM_REQUEST", { clientID });
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID === null) {
        Logger.log(false, "Client is not in a room!", "NETWORK_EVENTS.MESSAGE_ROOM_REQUEST", { clientID });
        return false;
    }
    
    this.roomManager.processMessage(clientRoomID, clientID, message);

    return true;
}

ServerContext.prototype.registerNetworkEvents = function(socket) {
    socket.on(NETWORK_EVENTS.DISCONNECT, () => this.handleDisconnect(socket.id));
	socket.on(NETWORK_EVENTS.REGISTER, (data, request) => request(this.handleRegister(socket.id, data)));
    socket.on(NETWORK_EVENTS.CREATE_ROOM_REQUEST, (roomType, request) => request(this.handleRoomCreate(socket.id, roomType)));
    socket.on(NETWORK_EVENTS.JOIN_ROOM_REQUEST, (roomID, request) => request(this.handleRoomJoin(socket.id, roomID)));
    socket.on(NETWORK_EVENTS.LEAVE_ROOM_REQUEST, (request) => request(this.handleRoomLeave(socket.id)));
    socket.on(NETWORK_EVENTS.MESSAGE_ROOM_REQUEST, (message, request) => request(this.handleRoomMessage(socket.id, message)));
}