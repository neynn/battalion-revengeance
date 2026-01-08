import { RoomManager } from "../room/roomManager.js";

export const SocketClient = function(id, socket) {
    this.id = id;
    this.socket = socket;
    this.userID = "";
    this.roomID = RoomManager.INVALID_ID;
}

SocketClient.prototype.getSocket = function() {
    return this.socket;
}

SocketClient.prototype.getUserID = function() {
    return this.userID;
}

SocketClient.prototype.setUserID = function(userID) {
    this.userID = userID;
}

SocketClient.prototype.joinRoom = function(room) {
    if(this.roomID === RoomManager.INVALID_ID) {
        const roomID = room.getID();

        this.socket.join(roomID);
        this.roomID = roomID;

        room.addMember(this.id, this);
    }
}

SocketClient.prototype.leaveRoom = function(room) {
    const roomID = room.getID();

    if(this.roomID === roomID) {
        this.socket.leave(this.roomID);
        this.roomID = RoomManager.INVALID_ID;

        room.removeMember(this.id);
    }
}   

SocketClient.prototype.getRoomID = function() {
    return this.roomID;
}