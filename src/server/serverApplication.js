import { SocketServer } from "../../engine/network/server/socketServer.js";
import { ServerPathHandler } from "../../engine/resources/serverPathHandler.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { ServerGameContext } from "./serverContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { MapRegistry } from "../map/mapRegistry.js";
import { registerServerActions } from "../systems/context.js";
import { resolveTileType } from "../enumHelpers.js";
import { MAX_TEAMS } from "../constants.js";
import { TILE_ID, TILE_TYPE } from "../enums.js";

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
    this.tileManager.load(resources.tileCategories, resources.logicTiles, resources.visualTiles, resources.autotilers, resolveTileType);
    this.tileManager.createCustomTile(TILE_ID.RIVER_10, TILE_TYPE.SEA);
    this.mapRegistry.load(resources.maps);
    this.typeRegistry.load(resources);
}

ServerApplication.prototype.createRoom = function(roomID, roomType) {
    const gameContext = new ServerGameContext(this, roomID);

    //All rooms have a maximum of 8 players.
    gameContext.maxClients = MAX_TEAMS;

    registerServerActions(gameContext);

    return gameContext;
}