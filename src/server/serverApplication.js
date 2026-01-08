import { MapRepository } from "../../engine/map/mapRepository.js";
import { SocketServer } from "../../engine/network/server/socketServer.js";
import { ServerPathHandler } from "../../engine/resources/serverPathHandler.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { ServerGameContext } from "../serverContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ServerApplication = function(io) {
    SocketServer.call(this, io);

    this.pathHandler = new ServerPathHandler();
    this.typeRegistry = new TypeRegistry();
    this.tileManager = new TileManager();
    this.mapRepository = new MapRepository();
}

ServerApplication.prototype = Object.create(SocketServer.prototype);
ServerApplication.prototype.constructor = ServerApplication;

ServerApplication.prototype.init = function(resources) {
    this.tileManager.loadServer(resources.tileMeta, resources.autotilers);
    this.mapRepository.load(resources.maps);
    this.typeRegistry.load(resources);
}

ServerApplication.prototype.createRoom = function(roomID, roomType) {
    const gameContext = new ServerGameContext(this, roomID);

    gameContext.maxClients = 2;
    gameContext.init();

    return gameContext;
}