import { SocketServer } from "../../engine/network/server/socketServer.js";
import { ServerPathHandler } from "../../engine/resources/serverPathHandler.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { ServerGameContext } from "./serverContext.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { MapRegistry } from "../map/mapRegistry.js";
import { loadTiles, registerActionVTables } from "../systems/context.js";
import { MAX_TEAMS } from "../constants.js";
import { TILE_ID, TILE_TYPE } from "../enums.js";
import { ScenarioRegistry } from "../scenario/scenarioRegistry.js";

export const ServerApplication = function(io) {
    SocketServer.call(this, io);

    this.pathHandler = new ServerPathHandler();
    this.typeRegistry = new TypeRegistry();
    this.tileManager = new TileManager();
    this.mapRegistry = new MapRegistry();
    this.scenarioRegistry = new ScenarioRegistry();
}

ServerApplication.prototype = Object.create(SocketServer.prototype);
ServerApplication.prototype.constructor = ServerApplication;

ServerApplication.prototype.init = function(resources) {
    loadTiles(this);
    this.mapRegistry.load(resources.maps);
    this.typeRegistry.load(resources);
    this.scenarioRegistry.load(this, resources.scenarioTypes);
}

ServerApplication.prototype.createRoom = function(roomID, roomType) {
    const gameContext = new ServerGameContext(this, roomID);

    //All rooms have a maximum of 8 players.
    gameContext.maxClients = MAX_TEAMS;

    registerActionVTables(gameContext);

    return gameContext;
}