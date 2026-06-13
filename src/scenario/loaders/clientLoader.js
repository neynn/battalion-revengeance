import { unpackEntitySnapshot } from "../../action/packer_constants.js";
import { LOADER_RULE } from "../../enums.js";
import { createEntitySnapshot, createEntitySnapshotFromEntry } from "../../snapshot/entitySnapshot.js";
import { createClientEntityObject, createMineObject } from "../../systems/spawn.js";
import { TeamManager } from "../../team/teamManager.js";
import { ScenarioLoader } from "../scenarioLoader.js";

export const ClientScenarioLoader = function(worldMap, scenario) {
    ScenarioLoader.call(this, worldMap, scenario);

    this.music = scenario.music; 
    this.playlist = scenario.playlist;
    this.prelogue = scenario.prelogue;
    this.postlogue = scenario.postlogue;
    this.defeat = scenario.defeat;
    this.clientTeam = scenario.client;
}

ClientScenarioLoader.prototype = Object.create(ScenarioLoader.prototype);
ClientScenarioLoader.prototype.constructor = ClientScenarioLoader;

ClientScenarioLoader.prototype.createBuildingSprites = function(gameContext) {
    const { spriteController } = gameContext;

    for(const building of this.worldMap.buildings) {
        spriteController.createBuildingSprite(gameContext, building);
    }
}

ClientScenarioLoader.prototype.createActors = function(gameContext) {
    const { teamManager } = gameContext;

    if(this.rules & LOADER_RULE.ALLOW_SPECTATOR) {
        //If no client team is found, assume they're a spectator.
        if(this.clientTeam === TeamManager.INVALID_ID) {
            this.createSpectator(gameContext);
        }
    }

    teamManager.forEachTeam((team) => {
        const { id } = team;

        if(id === this.clientTeam) {
            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            this.createPlayer(gameContext, id);
        } else {
            this.createActor(gameContext, id);
        }
    });
}

ClientScenarioLoader.prototype.loadScenarioText = function(gameContext) {
    const { language } = gameContext;

    this.localizeTiles();
    
    language.clearScenarioAndMapText();
    language.registerScenarioText(this.scenario.text);
}

ClientScenarioLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const config of this.scenario.entities) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromEntry(gameContext, config);
        const entity = createClientEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ClientScenarioLoader.prototype.loadMusic = function(gameContext) {
    const { client } = gameContext;
    const { musicPlayer } = client;

    if(this.playlist) {
        musicPlayer.playPlaylist(this.playlist);
    } else {
        musicPlayer.playTrack(this.music);
    }
}

ClientScenarioLoader.prototype.loadTurnFromSnapshot = function(gameContext, turn) {
    const { teamManager } = gameContext;
    const { team, rounds, turns } = turn;

    teamManager.loadFromSave(team, turns, rounds);
    teamManager.updateActor(gameContext);
}

ClientScenarioLoader.prototype.unpackTotalEntityBuffer = function(gameContext, entities) {
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

ClientScenarioLoader.prototype.createServerMatch = function(gameContext, snapshot, overrides) {
    const { dialogueHandler } = gameContext;
    const { turn, entities, teams } = snapshot; //TODO(neyn): Colors to team overrides!

    this.rules |= LOADER_RULE.ALLOW_SPECTATOR;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.unpackTotalEntityBuffer(gameContext, entities);
    this.createMines(gameContext);
    this.applyBuildingSettings();
    this.createBuildingSprites(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);

    this.loadTurnFromSnapshot(gameContext, turn);
    this.loadScenarioText(gameContext);
}

ClientScenarioLoader.prototype.createSavedMatch = function(gameContext, snapshot, overrides) {
    const { world, dialogueHandler, teamManager } = gameContext;
    const { entityManager, eventHandler } = world;
    const { mapID, turn, events, data, entities, teams, mines, buildings, flags, climate } = snapshot;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.worldMap.flags = flags;
    this.worldMap.climate = climate;
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
}

ClientScenarioLoader.prototype.createDefaultMatch = function(gameContext, overrides) {
    const { dialogueHandler } = gameContext;

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CUSTOM_COLOR;
    this.rules |= LOADER_RULE.CREATE_EVENT_EFFECTS;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.applyBuildingSettings();
    this.createBuildingSprites(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.createWorldEvents(gameContext);
    this.loadScenarioText(gameContext);

    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);
}