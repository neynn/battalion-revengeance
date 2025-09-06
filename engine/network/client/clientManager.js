import { EventEmitter } from "../../events/eventEmitter.js";
import { Logger } from "../../logger.js";
import { Client } from "./client.js";

export const ClientManager = function() {
    this.clients = new Map();

    this.events = new EventEmitter();
    this.events.listen(ClientManager.EVENT.CLIENT_CREATE);
    this.events.listen(ClientManager.EVENT.CLIENT_DELETE);
    this.events.listen(ClientManager.EVENT.USER_ID_ADDED);
}

ClientManager.EVENT = {
    "CLIENT_CREATE": "CLIENT_CREATE",
    "CLIENT_DELETE": "CLIENT_DELETE",
    "USER_ID_ADDED": "USER_ID_ADDED"
}

ClientManager.prototype.exit = function() {
    this.clients.clear();
    this.events.deafenAll();
}

ClientManager.prototype.destroyClient = function(clientID) {
    if(!this.clients.has(clientID)) {
        return false;
    }

    this.clients.delete(clientID);
    this.events.emit(ClientManager.EVENT.CLIENT_DELETE, clientID);

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
    this.events.emit(ClientManager.EVENT.CLIENT_CREATE, clientID, client);

    return client;
}

ClientManager.prototype.addUserID = function(clientID, userID) {
    const client = this.clients.get(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "ClientManager.prototype.addUserID", { clientID, userID });
        return false;
    }

    client.setUserID(userID);

    this.events.emit(ClientManager.EVENT.USER_ID_ADDED, clientID, userID);

    return true;
}