import { NETWORK_EVENTS, ROOM_EVENTS } from "../events.js";
import { RoomManager } from "../room/roomManager.js";
import { ClientManager } from "../client/clientManager.js";

export const SocketServer = function(io) {
    this.io = io;
    this.io.on('connection', (socket) => this.onClientConnect(socket));

    this.roomManager = new RoomManager();
    this.clientManager = new ClientManager();

    this.roomManager.events.on(RoomManager.EVENT.ROOM_OPENED, ({ id }) => console.log(`Room ${id} has been opened!`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.ROOM_CLOSED, ({ id }) => console.log(`Room ${id} has been closed!`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_RECEIVED, ({ roomID, messengerID }) => console.log(`Message received! ${roomID, messengerID}`), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_LOST, ({ roomID, messengerID }) => `Message lost! ${roomID, messengerID}`, { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_SEND, ({ clientID, message }) => this.io.to(clientID).emit(NETWORK_EVENTS.MESSAGE, message), { permanent: true });
    this.roomManager.events.on(RoomManager.EVENT.MESSAGE_BROADCAST, ({ roomID, message }) => this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message), { permanent: true });

    this.clientManager.events.on(ClientManager.EVENT.CLIENT_CREATE, ({ id }) => console.log(`${id} has been created!`), { permanent: true });
    this.clientManager.events.on(ClientManager.EVENT.CLIENT_DESTROY, ({ id }) => console.log(`${id} has been removed!`), { permanent: true });
    this.clientManager.events.on(ClientManager.EVENT.USER_ID_ADDED, ({ clientID, userID }) => console.log(`${clientID} is now named ${userID}!`), { permanent: true });
}

SocketServer.prototype.createRoom = function(roomID, roomType) {
    console.error("CreateRoom was not overridden!");
    return null;
}

SocketServer.prototype.sendRoomUpdate = function(roomID) {
    const information = this.roomManager.getRoomInformationMessage(roomID);
    const message = { "type": ROOM_EVENTS.ROOM_UPDATE, "payload": information };

    this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message);

    console.log(information);
}

SocketServer.prototype.onClientConnect = function(socket) {
    this.registerNetworkEvents(socket);
    this.clientManager.createClient(socket);

    console.log(`${socket.id} has connected to the server!`);
}

SocketServer.prototype.onClientDisconnect = function(clientID) {
    this.onLeaveRoomRequest(clientID);
    this.clientManager.destroyClient(clientID);

    console.log(`${clientID} has disconnected from the server!`);
}

SocketServer.prototype.onLeaveRoomRequest = function(clientID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        console.error("Client does not exist!");
        return false;
    }

    const roomID = client.getRoomID();
    const room = this.roomManager.getRoom(roomID);

    if(!room) {
        console.error("Room does not exist!");
        return false;
    }

    client.leaveRoom(room);

    if(room.isEmpty()) {
        this.roomManager.destroyRoom(roomID);
    } else {
        if(!room.hasLeader()) {
            room.appointNextLeader();
        }

        this.sendRoomUpdate(roomID);
    }

    return true;
}

SocketServer.prototype.handleRegister = function(clientID, data) {
    this.clientManager.addUserID(clientID, data["user-id"]);

    return true;
}

SocketServer.prototype.tCreateRoom = function() {
    const roomID = this.roomManager.getNextID();
    const room = this.createRoom(roomID, 0);

    if(!room) {
        console.error("Room was not created!");
        return false;
    }

    this.roomManager.addRoom(room);
    this.sendRoomUpdate(roomID);
}

SocketServer.prototype.onCreateRoomRequest = function(clientID, roomType) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        console.error("Client does not exist!");
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== RoomManager.INVALID_ID) {
        console.error("Client is already in room!");
        return false;
    }

    const roomID = this.roomManager.getNextID();
    const room = this.createRoom(roomID, roomType);

    if(!room) {
        console.error("Room was not created!");
        return false;
    }

    if(!room.canJoin(clientID)) {
        console.error("Room is not joinable!");
        return false;
    }

    client.joinRoom(room);
    room.setLeader(clientID);

    this.roomManager.addRoom(room);
    this.sendRoomUpdate(roomID);

    return true;
}

SocketServer.prototype.onJoinRoomRequest = function(clientID, roomID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        console.error("Client does not exist!");
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== RoomManager.INVALID_ID) {
        console.error("Client is already in a room!");
        return false;
    }

    const room = this.roomManager.getRoom(roomID);

    if(!room || !room.canJoin(clientID)) {
        console.error("Room is not joinable!");
        return false;
    }

    client.joinRoom(room);

    this.sendRoomUpdate(roomID);

    return true;
}

SocketServer.prototype.onMessageRoomRequest = function(clientID, message) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        console.error("Client does not exist!");
        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID === RoomManager.INVALID_ID) {
        console.error("Client is not in a room!");
        return false;
    }
    
    this.roomManager.processMessage(clientRoomID, clientID, message);

    return true;
}

SocketServer.prototype.registerNetworkEvents = function(socket) {
    socket.on(NETWORK_EVENTS.DISCONNECT, () => this.onClientDisconnect(socket.id));
	socket.on(NETWORK_EVENTS.REGISTER, (data, request) => request(this.handleRegister(socket.id, data)));
    socket.on(NETWORK_EVENTS.CREATE_ROOM_REQUEST, (roomType, request) => request(this.onCreateRoomRequest(socket.id, roomType)));
    socket.on(NETWORK_EVENTS.JOIN_ROOM_REQUEST, (roomID, request) => request(this.onJoinRoomRequest(socket.id, roomID)));
    socket.on(NETWORK_EVENTS.LEAVE_ROOM_REQUEST, (request) => request(this.onLeaveRoomRequest(socket.id)));
    socket.on(NETWORK_EVENTS.MESSAGE_ROOM_REQUEST, (message, request) => request(this.onMessageRoomRequest(socket.id, message)));
}