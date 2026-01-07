export const SocketClient = function(id, socket) {
    this.id = id;
    this.socket = socket;
    this.userID = null;
    this.roomID = null;
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

SocketClient.prototype.joinRoom = function(roomID) {
    this.socket.join(roomID);
    this.roomID = roomID;
}

SocketClient.prototype.leaveRoom = function() {
    this.socket.leave(this.roomID);
    this.roomID = null;
}   

SocketClient.prototype.getRoomID = function() {
    return this.roomID;
}