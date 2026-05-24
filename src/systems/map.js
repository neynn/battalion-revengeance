import { BattalionMap } from "../map/battalionMap.js";
import { createClientEntityObject, createMineObject, createServerEntityObject } from "./spawn.js";
import { LAYER_TYPE, LOADER_RULE, MINE_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";
import { createEntitySnapshot, createEntitySnapshotFromEntry } from "../snapshot/entitySnapshot.js";
import { MatchLoader } from "./loader/matchLoader.js";
import { unpackEntitySnapshot } from "../action/packer_constants.js";
import { createBuildingSnapshotFromJSON } from "../snapshot/buildingSnapshot.js";
import { transformTileToWorld } from "../../engine/math/transform2D.js";
import { MapPreview } from "../map/mapPreview.js";
import { Texture } from "../../engine/resources/texture/texture.js";
import { updateBuildingSprite } from "./sprite.js";

export const ClientMatchLoader = function(worldMap, scenario) {
    MatchLoader.call(this, worldMap, scenario);

    this.music = scenario.music; 
    this.playlist = scenario.playlist;
    this.prelogue = scenario.prelogue;
    this.postlogue = scenario.postlogue;
    this.defeat = scenario.defeat;
    this.clientTeam = scenario.client;
}

ClientMatchLoader.prototype = Object.create(MatchLoader.prototype);
ClientMatchLoader.prototype.constructor = ClientMatchLoader;

ClientMatchLoader.prototype.createBuildingSprites = function(gameContext) {
    const { teamManager, spriteManager, typeRegistry } = gameContext;

    for(const building of this.worldMap.buildings) {
        const { tileX, tileY } = building;
        const position = transformTileToWorld(tileX, tileY);
        const spriteObject = spriteManager.createEmptySprite(LAYER_TYPE.BUILDING);
        const spriteIndex = spriteObject.getIndex();

        spriteObject.setPosition(position.x, position.y);
        building.spriteID = spriteIndex;

        updateBuildingSprite(gameContext, building, spriteIndex);
    }
}

ClientMatchLoader.prototype.createActors = function(gameContext) {
    const { teamManager } = gameContext;
    const clientTeamID = teamManager.getTeamID(this.clientTeam);

    if(this.rules & LOADER_RULE.ALLOW_SPECTATOR) {
        //If no client team is found, assume they're a spectator.
        if(clientTeamID === TeamManager.INVALID_ID) {
            this.createSpectator(gameContext);
        }
    }

    teamManager.forEachTeam((team) => {
        const { id } = team;

        if(id === clientTeamID) {
            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            this.createPlayer(gameContext, id);
        } else {
            this.createActor(gameContext, id);
        }
    });
}

ClientMatchLoader.prototype.loadScenarioText = function(gameContext) {
    const { language } = gameContext;
    const text = this.scenario.text;
    const table = this.scenario.textMap;

    this.localizeTiles();
    
    language.clearScenarioAndMapText();
    language.registerScenarioText(text, table);
}

ClientMatchLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const config of this.entities) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromEntry(gameContext, config);
        const entity = createClientEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ClientMatchLoader.prototype.loadMusic = function(gameContext) {
    const { client } = gameContext;
    const { musicPlayer } = client;

    if(this.playlist) {
        musicPlayer.playPlaylist(this.playlist);
    } else {
        musicPlayer.playTrack(this.music);
    }
}

ClientMatchLoader.prototype.loadTurnFromSnapshot = function(gameContext, turn) {
    const { teamManager } = gameContext;
    const { team, rounds, turns } = turn;

    teamManager.setActive(team);
    teamManager.round = rounds;
    teamManager.turn = turns;
    teamManager.updateActor(gameContext);
}

ClientMatchLoader.prototype.unpackTotalEntityBuffer = function(gameContext, entities) {
    const view = new DataView(entities);
    const count = view.getUint16(0, true);
    let byteOffset = 2;

    for(let i = 0; i < count; i++) {
        const entityID = view.getInt16(byteOffset, true);
        const snapshot = createEntitySnapshot();

        byteOffset = unpackEntitySnapshot(snapshot, view, byteOffset + 2);

        createClientEntityObject(gameContext, entityID, snapshot);
    }
}

ClientMatchLoader.prototype.createServerMatch = function(gameContext, snapshot, overrides) {
    const { dialogueHandler, spriteManager } = gameContext;
    const { turn, entities, teams } = snapshot; //TODO(neyn): Colors to team overrides!

    this.rules |= LOADER_RULE.ALLOW_SPECTATOR;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.unpackTotalEntityBuffer(gameContext, entities);
    this.createMines(gameContext);
    this.applyBuildingSettings(gameContext);
    this.createBuildingSprites(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);

    this.loadTurnFromSnapshot(gameContext, turn);
    this.loadScenarioText(gameContext);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

ClientMatchLoader.prototype.createSavedMatch = function(gameContext, snapshot, overrides) {
    const { world, dialogueHandler, teamManager, spriteManager } = gameContext;
    const { entityManager, eventHandler } = world;
    const { mapID, turn, events, data, entities, teams, mines, buildings } = snapshot;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.worldMap.decodeLayers(data);
    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);

    for(let i = 0; i < teams.length; i++) {
        teamManager.teams[i].load(teams[i]);
    }

    for(const snapshot of mines) {
        const { type, tileX, tileY, teamID } = snapshot;
        const mine = createMineObject(gameContext, teamID, type, tileX, tileY);

        mine.load(snapshot);
        this.worldMap.addMine(mine);
    }

    for(const snapshot of buildings) {
        const { tileX, tileY } = snapshot;
        const building = this.worldMap.getBuilding(tileX, tileY);

        if(building) {
            building.load(snapshot);
        }
    }

    for(const blob of entities) {
        const nextID = entityManager.getNextID();

        createClientEntityObject(gameContext, nextID, blob);
    }

    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.createBuildingSprites(gameContext);

    eventHandler.loadTriggeredEvents(events);
    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);

    this.loadTurnFromSnapshot(gameContext, turn);
    this.loadScenarioText(gameContext);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

ClientMatchLoader.prototype.createDefaultMatch = function(gameContext, overrides) {
    const { dialogueHandler, spriteManager } = gameContext;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.applyBuildingSettings(gameContext);
    this.createBuildingSprites(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.loadScenarioText(gameContext);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

export const ServerMatchLoader = function(worldMap, scenario) {
    MatchLoader.call(this, worldMap, scenario);
}

ServerMatchLoader.prototype = Object.create(MatchLoader.prototype);
ServerMatchLoader.prototype.constructor = ServerMatchLoader;

ServerMatchLoader.prototype.createActors = function(gameContext) {
    const { teamManager, mapMaster } = gameContext;
    const { slots } = mapMaster;

    teamManager.forEachTeam((team) => {
        const { id } = team;
        let client = null;

        for(const { teamID, clientID } of slots) {
            const tTeamID = teamManager.getTeamID(teamID);

            if(tTeamID === id) {
                client = clientID;
                break;
            }
        }

        this.createServerActor(gameContext, id, client);
    })
}

ServerMatchLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world; 

    for(let i = 0; i < this.entities.length; i++) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromEntry(gameContext, this.entities[i]);
        const entity = createServerEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ServerMatchLoader.prototype.loadMap = function(gameContext, overrides) {
    //TODO(neyn): Split into PvP and COOP.
    //COOP has fixed allies, PvP does not.
    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.applyBuildingSettings(gameContext);
    this.createMines(gameContext);
    this.createWorldEvents(gameContext);
}

export const createEmptyMap = function(gameContext, width, height) {     
    const { world } = gameContext;
    const { mapManager } = world;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height);

    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return worldMap;
}

/**
 * 
 * @param {*} gameContext 
 * @param {*} file 
 * @param {MapPreview} source 
 * @returns 
 */
const createWorldMap = function(gameContext, file, source) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { width, height, data, buildings = [] } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height);

    worldMap.name = source.title;
    worldMap.decodeLayers(data);

    for(const setup of buildings) {
        const snapshot = createBuildingSnapshotFromJSON(setup);

        worldMap.createBuilding(gameContext, snapshot);
    }

    return worldMap;
}

const loadClientMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world, language, scenarioRegistry } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file === null) {
        return Promise.reject();
    }

    const worldMap = createWorldMap(gameContext, file, mapSource);

    mapManager.addMap(worldMap);
    mapManager.enableMap(worldMap.getID());

    return worldMap;
}

const loadServerMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file === null) {
        return Promise.reject();
    }

    const worldMap = createWorldMap(gameContext, file, mapSource);
    
    mapManager.addMap(worldMap);
    mapManager.enableMap(worldMap.getID());

    return worldMap;
}

export const loadEditorMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file !== null) {
        const worldMap = createWorldMap(gameContext, file, mapSource);

        mapManager.addMap(worldMap);
        mapManager.enableMap(worldMap.getID());
        
        return worldMap;
    }

    return null;
}

export const loadClientScenario = async function(gameContext, scenarioID) {
    const { scenarioRegistry } = gameContext;
    const scenario = scenarioRegistry.getScenario(scenarioID);

    if(!scenario) {
        return Promise.reject();
    }

    const { mapID } = scenario;
    const worldMap = await loadClientMap(gameContext, mapID);

    worldMap.scenario = scenarioID;

    const matchLoader = new ClientMatchLoader(worldMap, scenario);

    return matchLoader;
}

export const loadServerScenario = async function(gameContext, scenarioID) {
    const { scenarioRegistry } = gameContext;
    const scenario = scenarioRegistry.getScenario(scenarioID);

    if(!scenario) {
        return Promise.reject();
    }

    const { mapID } = scenario;
    const worldMap = await loadServerMap(gameContext, mapID);

    worldMap.scenario = scenarioID;

    const matchLoader = new ServerMatchLoader(worldMap, scenario);

    return matchLoader;
}