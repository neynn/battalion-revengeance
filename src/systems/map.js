import { BattalionMap } from "../map/battalionMap.js";
import { createClientBuildingObject, createClientEntityObject, createMineObject, createServerBuildingObject, createServerEntityObject } from "./spawn.js";
import { LAYER_TYPE, LOADER_RULE, MINE_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";
import { createEntitySnapshot, createEntitySnapshotFromJSON } from "../snapshot/entitySnapshot.js";
import { MatchLoader } from "./loader/matchLoader.js";
import { unpackEntitySnapshot } from "../action/packer_constants.js";
import { createBuildingSnapshotFromJSON } from "../snapshot/buildingSnapshot.js";

export const ClientMatchLoader = function(worldMap, mapFile) {
    MatchLoader.call(this, worldMap, mapFile);

    this.music = mapFile.music ?? "rivers_of_steel";
    this.playlist = mapFile.playlist ?? null;
    this.localization = mapFile.localization ?? [];
    this.prelogue = mapFile.prelogue ?? [];
    this.postlogue = mapFile.postlogue ?? [];
    this.defeat = mapFile.defeat ?? [];
    this.clientTeam = mapFile.client ?? null;
}

ClientMatchLoader.prototype = Object.create(MatchLoader.prototype);
ClientMatchLoader.prototype.constructor = ClientMatchLoader;

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

ClientMatchLoader.prototype.createBuildings = function(gameContext) {
    for(const building of this.buildings) {
        const snapshot = createBuildingSnapshotFromJSON(gameContext, this.worldMap, building);

        createClientBuildingObject(gameContext, this.worldMap, snapshot); 
    }
}

ClientMatchLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const config of this.entities) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromJSON(gameContext, this.worldMap, config);
        const entity = createClientEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ClientMatchLoader.prototype.createMines = function(gameContext) {
    const { teamManager, typeRegistry } = gameContext;

    for(const mine of this.mines) {
        const { 
            x = -1, 
            y = -1,
            team = null,
            type = "NONE",
            visible = false
        } = mine;

        const teamID = teamManager.getTeamID(team);
        const typeID = MINE_TYPE[type] ?? MINE_TYPE.LAND;
        const { category } = typeRegistry.getMineType(typeID);

        if(this.worldMap.isMinePlaceable(gameContext, x, y, category)) {
            const mineObject = createMineObject(gameContext, teamID, typeID, x, y);

            if(visible) {
                mineObject.show();
            }
            
            this.worldMap.addMine(mineObject);
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

ClientMatchLoader.prototype.loadInitialServerSnapshot = function(gameContext, snapshot, overrides) {
    const { dialogueHandler, teamManager, spriteManager } = gameContext;
    const { mapID, turn, entities, teams } = snapshot; //TODO(neyn): Colors to team overrides!

    this.rules |= LOADER_RULE.ALLOW_SPECTATOR;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.unpackTotalEntityBuffer(gameContext, entities);
    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.worldMap.loadLocalization(this.localization);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);
    teamManager.updateStatus(); //TODO(neyn): Really necessary?

    this.loadTurnFromSnapshot(gameContext, turn);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

ClientMatchLoader.prototype.loadMapFromSnapshot = function(gameContext, snapshot, overrides) {
    const { world, dialogueHandler, teamManager, spriteManager } = gameContext;
    const { entityManager, eventHandler } = world;
    const { mapID, turn, events, edits, entities, teams, mines, buildings } = snapshot;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);

    for(let i = 0; i < teams.length; i++) {
        teamManager.teams[i].load(teams[i]);
    }

    for(const blob of mines) {
        const { type, tileX, tileY, teamID } = blob;
        const mine = createMineObject(gameContext, teamID, type, tileX, tileY);

        mine.load(blob);
        this.worldMap.addMine(mine);
    }

    for(const blob of buildings) {
        createClientBuildingObject(gameContext, this.worldMap, blob);
    }

    for(const blob of entities) {
        const nextID = entityManager.getNextID();

        createClientEntityObject(gameContext, nextID, blob);
    }

    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.worldMap.loadLocalization(this.localization);
    this.worldMap.loadEdits(edits);

    eventHandler.loadTriggeredEvents(events);
    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);
    teamManager.updateStatus();

    this.loadTurnFromSnapshot(gameContext, turn);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

ClientMatchLoader.prototype.loadMapFromFile = function(gameContext, overrides) {
    const { dialogueHandler, teamManager, spriteManager } = gameContext;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.worldMap.loadLocalization(this.localization);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);
    teamManager.updateStatus();

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

export const ServerMatchLoader = function(worldMap, mapFile) {
    MatchLoader.call(this, worldMap, mapFile);
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

ServerMatchLoader.prototype.createBuildings = function(gameContext) {
    for(const building of this.buildings) {
        const snapshot = createBuildingSnapshotFromJSON(gameContext, this.worldMap, building);

        createServerBuildingObject(gameContext, this.worldMap, snapshot);
    }
}

ServerMatchLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world; 

    for(let i = 0; i < this.entities.length; i++) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromJSON(gameContext, this.worldMap, this.entities[i]);
        const entity = createServerEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ServerMatchLoader.prototype.createMines = function(gameContext) {
    const { teamManager, typeRegistry } = gameContext;

    for(const mine of this.mines) {
        const { 
            x = -1, 
            y = -1,
            team = null,
            type = "NONE",
            hidden = false
        } = mine;

        const teamID = teamManager.getTeamID(team);
        const typeID = MINE_TYPE[type] ?? MINE_TYPE.LAND;
        const { category } = typeRegistry.getMineType(typeID);

        if(this.worldMap.isMinePlaceable(gameContext, x, y, category)) {
            const mineObject = createMineObject(gameContext, teamID, typeID, x, y);

            if(hidden) {
                mineObject.hide();
            }

            this.worldMap.addMine(mineObject);
        }
    }
}

ServerMatchLoader.prototype.loadMap = function(gameContext, overrides) {
    const { teamManager } = gameContext;

    //TODO(neyn): Split into PvP and COOP.
    //COOP has fixed allies, PvP does not.
    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.createWorldEvents(gameContext);

    teamManager.updateStatus();
}

export const createEditorMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file !== null) {
        const { width, height, data } = file;
        const nextID = mapManager.getNextID();
        const worldMap = new BattalionMap(nextID, width, height, mapSource);

        worldMap.decodeLayers(data);
        mapManager.addMap(worldMap);
        mapManager.enableMap(nextID);
        
        return worldMap;
    }

    return null;
}

export const createEmptyMap = function(gameContext, width, height) {     
    const { world } = gameContext;
    const { mapManager } = world;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height, null);

    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return worldMap;
}

export const createClientMapLoader = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world, language } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

    if(file === null) {
        return null;
    }

    const { width, height, data, text = [], custom = [] } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height, mapSource);

    worldMap.createTextMapping(text);
    worldMap.createCustomMapping(custom);
    worldMap.decodeLayers(data);
    language.clearMapTranslations();

    if(translations !== null) {
        language.registerMapText(translations, text);
    }

    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return new ClientMatchLoader(worldMap, file);
}

export const createServerMapLoader = async function(gameContext, sourceID) {
    const { pathHandler, mapRegistry, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRegistry.getMapPreview(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file === null) {
        return null;
    }

    const { width, height, data, text = [], custom = [] } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height, mapSource);

    worldMap.createTextMapping(text);
    worldMap.createCustomMapping(custom);
    worldMap.decodeLayers(data);
    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return new ServerMatchLoader(worldMap, file);
}