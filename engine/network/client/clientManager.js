import { EventEmitter } from "../../events/eventEmitter.js";
import { Client } from "./client.js";

export const ClientManager = function() {
    this.clients = new Map();

    this.events = new EventEmitter();
    this.events.register(ClientManager.EVENT.CLIENT_CREATE);
    this.events.register(ClientManager.EVENT.CLIENT_DESTROY);
    this.events.register(ClientManager.EVENT.USER_ID_ADDED);
}

ClientManager.EVENT = {
    CLIENT_CREATE: "CLIENT_CREATE",
    CLIENT_DESTROY: "CLIENT_DESTROY",
    USER_ID_ADDED: "USER_ID_ADDED"
}

ClientManager.prototype.exit = function() {
    this.clients.clear();
    this.events.removeAll();
}

ClientManager.prototype.destroyClient = function(clientID) {
    if(!this.clients.has(clientID)) {
        return false;
    }

    this.clients.delete(clientID);
    this.events.emit(ClientManager.EVENT.CLIENT_DESTROY, {
        "id": clientID
    });

    return true;
}

ClientManager.prototype.getClient = function(clientID) {
    const client = this.clients.get(clientID);

    if(!client) {
        return null;
    }

    return client;
}

ClientManager.prototype.createClient = function(socket) {
    const clientID = socket.id;
    const client = new Client(clientID, socket);

    this.clients.set(clientID, client);
    this.events.emit(ClientManager.EVENT.CLIENT_CREATE, {
        "id": clientID,
        "client": client
    });

    return client;
}

ClientManager.prototype.addUserID = function(clientID, userID) {
    const client = this.clients.get(clientID);

    if(!client) {
        return false;
    }

    client.setUserID(userID);

    this.events.emit(ClientManager.EVENT.USER_ID_ADDED, {
        "clientID": clientID,
        "userID": userID
    });

    return true;
}