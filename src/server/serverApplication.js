import { SocketServer } from "../../engine/network/server/socketServer.js";
import { ServerPathHandler } from "../../engine/resources/serverPathHandler.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { ServerGameContext } from "./serverContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { MapRegistry } from "../map/mapRegistry.js";

export const ServerApplication = function(io) {
    SocketServer.call(this, io);

    this.pathHandler = new ServerPathHandler();
    this.typeRegistry = new TypeRegistry();
    this.tileManager = new TileManager();
    this.mapRegistry = new MapRegistry();
}

ServerApplication.prototype = Object.create(SocketServer.prototype);
ServerApplication.prototype.constructor = ServerApplication;

ServerApplication.prototype.init = function(resources) {
    this.tileManager.loadServer(resources.tileMeta, resources.autotilers);
    this.mapRegistry.load(resources.maps);
    this.typeRegistry.load(resources);
}

ServerApplication.prototype.createRoom = function(roomID, roomType) {
    const gameContext = new ServerGameContext(this, roomID);

    gameContext.maxClients = 3;
    gameContext.init();

    return gameContext;
}