export const Client = function(id, socket) {
    this.id = id;
    this.socket = socket;
    this.userID = null;
    this.roomID = null;
}

Client.prototype.getSocket = function() {
    return this.socket;
}

Client.prototype.getUserID = function() {
    return this.userID;
}

Client.prototype.setUserID = function(userID) {
    this.userID = userID;
}

Client.prototype.joinRoom = function(roomID) {
    this.socket.join(roomID);
    this.roomID = roomID;
}

Client.prototype.leaveRoom = function() {
    this.socket.leave(this.roomID);
    this.roomID = null;
}   

Client.prototype.getRoomID = function() {
    return this.roomID;
}