import { MapRepository } from "../../engine/map/mapRepository.js";
import { Transform2D } from "../../engine/math/transform2D.js";
import { SocketServer } from "../../engine/network/server/socketServer.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants.js";
import { ServerGameContext } from "../serverContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ServerApplication = function(io) {
    SocketServer.call(this, io);

    this.gameRooms = [];
    this.typeRegistry = new TypeRegistry();
    this.tileManager = new TileManager();
    this.transform2D = new Transform2D();
    this.mapRepository = new MapRepository();
    this.transform2D.setSize(TILE_WIDTH, TILE_HEIGHT);
}

ServerApplication.prototype = Object.create(SocketServer.prototype);
ServerApplication.prototype.constructor = ServerApplication;

ServerApplication.prototype.init = function(resources) {
    this.tileManager.loadServer(resources.tileMeta, resources.autotilers);
    this.mapRepository.load(resources.maps);
    this.typeRegistry.load(resources);
}

ServerApplication.prototype.createGame = function() {
    const gameContext = new ServerGameContext(this);

    gameContext.init();

    this.gameRooms.push(gameContext);

    return gameContext;
}