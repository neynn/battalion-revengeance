import { BattalionActor } from "../actors/battalionActor.js";
import { Player } from "../actors/player.js";
import { BattalionMap } from "../map/battalionMap.js";
import { CaptureObjective } from "../team/objective/types/capture.js";
import { DefeatObjective } from "../team/objective/types/defeat.js";
import { DefendObjective } from "../team/objective/types/defend.js";
import { ProtectObjective } from "../team/objective/types/protect.js";
import { SurviveObjective } from "../team/objective/types/survive.js";
import { TimeLimitObjective } from "../team/objective/types/timeLimit.js";
import { createPlayCamera } from "./camera.js";
import { spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
import { ClientBattalionEvent } from "../event/clientBattalionEvent.js";
import { ServerBattalionEvent } from "../event/serverBattalionEvent.js";
import { OBJECTIVE_TYPE } from "../enums.js";

const createActor = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.createActor((actorID) => {
        const actorObject = new BattalionActor(actorID);

        actorObject.setTeam(teamName);

        return actorObject;
    });

    actor.loadCommander(gameContext, commanderType);
    actor.setName("NPC");

    return actor;
}

const createPlayer = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.createActor((actorID) => {
        const context = createPlayCamera(gameContext);
        const camera = context.getCamera();
        const actorObject = new Player(actorID, camera);

        actorObject.setTeam(teamName);
        camera.addPerspective(teamName);
        camera.setMainPerspective(teamName);

        return actorObject;
    });

    actor.loadKeybinds(gameContext);
    actor.loadCommander(gameContext, commanderType);
    actor.states.setNextState(gameContext, Player.STATE.IDLE);
    actor.setName("PLAYER");

    return actor;
}

const createObjectives = function(team, objectives, allObjectives) {
    for(const objectiveID of objectives) {
        const config = allObjectives[objectiveID];

        if(!config) {
            continue;
        }

        const { type } = config;

        switch(type) {
            case OBJECTIVE_TYPE.DEFEAT: {
                team.addObjective(new DefeatObjective(config.target));
                break;
            }
            case OBJECTIVE_TYPE.PROTECT: {
                team.addObjective(new ProtectObjective(config.targets));
                break;
            }
            case OBJECTIVE_TYPE.CAPTURE: {
                team.addObjective(new CaptureObjective(config.tiles));
                break;
            }
            case OBJECTIVE_TYPE.DEFEND: {
                team.addObjective(new DefendObjective(config.tiles));
                break;
            }
            case OBJECTIVE_TYPE.SURVIVE: {
                team.addObjective(new SurviveObjective(config.turn));
                break;
            }
            case OBJECTIVE_TYPE.TIME_LIMIT: {
                team.addObjective(new TimeLimitObjective(config.turn));
                break;
            }
            default: {
                console.error("UNKNOWN OBJECTIVE TYPE!", type);
                break;
            }
        }
    }
}

const createTeam = function(gameContext, teamID, config, allObjectives) {
    const { teamManager } = gameContext;
    const { 
        nation = null,
        faction = null,
        color = null,
        objectives = []
    } = config;
    const team = teamManager.createTeam(teamID);

    if(!team) {
        console.log("Team could not be created!");
        return;
    }

    if(nation) {
        team.loadAsNation(gameContext, nation);
    }

    if(faction) {
        team.loadAsFaction(gameContext, faction);
    }

    if(color) {
        team.setColor(gameContext, color);
    }

    createObjectives(team, objectives, allObjectives);
}

const finalizeClientTeams = function(gameContext, teams, clientTeam) {
    const { teamManager } = gameContext;
    let playerCreated = false;

    for(const teamName in teams) {
        const team = teamManager.getTeam(teamName);

        if(!team) {
            continue;
        }

        const commanderType = teams[teamName].commander;
        const teamAllies = teams[teamName].allies ?? [];

        for(const teamID of teamAllies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        let actor = null;

        if(!playerCreated && clientTeam === teamName) {
            actor = createPlayer(gameContext, commanderType, teamName);
            playerCreated = true;
        } else {
            actor = createActor(gameContext, commanderType, teamName);
        }

        if(actor) {
            team.setActor(actor.getID());
        }
    }

    if(!playerCreated) {
        console.error("NO PLAYER SPECIFIED!");
    } 
}

const loadClientMap = function(gameContext, worldMap, mapData, clientTeam) {
    const { world, teamManager, dialogueHandler, client } = gameContext;
    const { eventHandler, turnManager } = world;
    const { musicPlayer } = client;
    const { 
        music,
        playlist,
        teams = {},
        entities = [],
        objectives = {},
        events = {},
        buildings = [],
        localization = [],
        prelogue = [],
        postlogue = [],
        defeat = []
    } = mapData;

    for(const teamName in teams) {
        createTeam(gameContext, teamName, teams[teamName], objectives);
    }

    finalizeClientTeams(gameContext, teams, clientTeam);

    for(let i = 0; i < entities.length; i++) {
        spawnClientEntity(gameContext, entities[i]);
    }

    for(let i = 0; i < buildings.length; i++) {
        spawnClientBuilding(gameContext, worldMap, buildings[i]);
    }

    if(playlist) {
        musicPlayer.playPlaylist(playlist);
    } else {
        musicPlayer.play(music);
    }

    worldMap.loadLocalization(localization);
    dialogueHandler.loadMapDialogue(prelogue, postlogue, defeat);

    for(const eventName in events) {
        const { turn, round, next = null, actions = [] } = events[eventName];
        const event = new ClientBattalionEvent(eventName, actions);

        event.setTriggerTime(turn, round);
        event.setNext(next);
        eventHandler.addEvent(event);
    }
    
    teamManager.updateStatus();

    const turnOrder = teamManager.getTurnOrder();

    turnManager.setActorOrder(turnOrder);
}

export const createEmptyMap = function(gameContext, width, height) {     
    const { world } = gameContext;
    const { mapManager } = world;
    const mapID = mapManager.getNextID();
    const worldMap = new BattalionMap(mapID, width, height);

    mapManager.addMap(worldMap);
    mapManager.enableMap(mapID);

    return worldMap;
}

export const createEditorMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRepository, world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRepository.getMapSource(sourceID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file !== null) {
        const { width, height, data } = file;
        const mapID = mapManager.getNextID();
        const worldMap = new BattalionMap(mapID, width, height);

        worldMap.setSource(mapSource);
        worldMap.decodeLayers(data);
        mapManager.addMap(worldMap);
        mapManager.enableMap(mapID);
        
        return worldMap;
    }

    return null;
}

export const createStoryMap = async function(gameContext, sourceID) {
    const { pathHandler, mapRepository, world, language } = gameContext;
    const { mapManager } = world;
    const mapSource = mapRepository.getMapSource(sourceID);
    const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

    if(file !== null) {
        const { width, height, data, client } = file;
        const mapID = mapManager.getNextID();
        const worldMap = new BattalionMap(mapID, width, height);

        worldMap.setSource(mapSource);
        worldMap.decodeLayers(data);

        if(translations !== null) {
            language.registerMapTranslations(translations);
        }

        mapManager.addMap(worldMap);
        mapManager.enableMap(mapID);

        loadClientMap(gameContext, worldMap, file, client);
    }
}

const mpClientLoadMap = function(gameContext, worldMap, mapData, clientTeam, entityMap) {
    const { world, teamManager, dialogueHandler, client } = gameContext;
    const { eventHandler, turnManager } = world;
    const { musicPlayer } = client;
    const { 
        music,
        playlist,
        teams = {},
        entities = [],
        objectives = {},
        events = {},
        buildings = [],
        localization = [],
        prelogue = [],
        postlogue = [],
        defeat = []
    } = mapData;

    for(const teamName in teams) {
        createTeam(gameContext, teamName, teams[teamName], objectives);
    }

    finalizeClientTeams(gameContext, teams, clientTeam);

    if(entityMap.length === entities.length) {
        for(let i = 0; i < entities.length; i++) {
            const mappedID = entityMap[i];

            spawnClientEntity(gameContext, entities[i], mappedID);
        }
    }

    for(let i = 0; i < buildings.length; i++) {
        spawnClientBuilding(gameContext, worldMap, buildings[i]);
    }

    if(playlist) {
        musicPlayer.playPlaylist(playlist);
    } else {
        musicPlayer.play(music);
    }

    worldMap.loadLocalization(localization);
    dialogueHandler.loadMapDialogue(prelogue, postlogue, defeat);

    for(const eventName in events) {
        const { turn, round, next = null, actions = [] } = events[eventName];
        const event = new ClientBattalionEvent(eventName, actions);

        event.setTriggerTime(turn, round);
        event.setNext(next);
        eventHandler.addEvent(event);
    }
    
    teamManager.updateStatus();

    const turnOrder = teamManager.getTurnOrder();

    turnManager.setActorOrder(turnOrder);
}

export const mpClientCreateStaticMap = async function(gameContext, payload) {
    const { pathHandler, mapRepository, world, language } = gameContext;
    const { mapManager } = world;
    const { settings, client } = payload;
    const { mapID, entities, teams } = settings;
    const mapSource = mapRepository.getMapSource(mapID);
    const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

    if(file !== null) {
        const { width, height, data } = file;
        const mapID = mapManager.getNextID();
        const worldMap = new BattalionMap(mapID, width, height);

        worldMap.setSource(mapSource);
        worldMap.decodeLayers(data);

        if(translations !== null) {
            language.registerMapTranslations(translations);
        }

        mapManager.addMap(worldMap);
        mapManager.enableMap(mapID);

        mpClientLoadMap(gameContext, worldMap, file, client, entities);
    }
}

export const ServerMapFactory = function() {}

ServerMapFactory.prototype.finalizeTeams = function(gameContext, teams) {
    const { teamManager } = gameContext;

    for(const teamName in teams) {
        const team = teamManager.getTeam(teamName);

        if(!team) {
            continue;
        }

        const commanderType = teams[teamName].commander;
        const teamAllies = teams[teamName].allies ?? [];

        for(const teamID of teamAllies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        const actor = createActor(gameContext, commanderType, teamName);

        if(actor) {
            team.setActor(actor.getID());
        }
    }
}

ServerMapFactory.prototype.spawnEntities = function(gameContext, entities, settings) {
    const { world } = gameContext;
    const { entityManager } = world; 

    for(let i = 0; i < entities.length; i++) {
        const entityID = entityManager.getNextID();
        
        spawnServerEntity(gameContext, entities[i], entityID);

        settings.addEntity(entityID);
    }
}

ServerMapFactory.prototype.spawnBuildings = function(gameContext, worldMap, buildings) {
    for(let i = 0; i < buildings.length; i++) {
        spawnServerBuilding(gameContext, worldMap, buildings[i]);
    }
}

ServerMapFactory.prototype.createEvents = function(gameContext, events) {
    const { world } = gameContext;
    const { eventHandler } = world;

    for(const eventName in events) {
        const { turn, round, next = null, actions = [] } = events[eventName];
        const event = new ServerBattalionEvent(eventName, actions);

        event.setTriggerTime(turn, round);
        event.setNext(next);
        eventHandler.addEvent(event);
    }
}

ServerMapFactory.prototype.loadMap = function(gameContext, worldMap, mapData, settings) {
    const { world, teamManager } = gameContext;
    const { turnManager } = world;
    const { 
        teams = {},
        entities = [],
        objectives = {},
        events = {},
        buildings = []
    } = mapData;

    for(const teamName in teams) {
        createTeam(gameContext, teamName, teams[teamName], objectives);
    }

    this.finalizeTeams(gameContext, teams);
    this.spawnEntities(gameContext, entities, settings);
    this.spawnBuildings(gameContext, worldMap, buildings);
    this.createEvents(gameContext, events);

    teamManager.updateStatus();

    const turnOrder = teamManager.getTurnOrder();

    turnManager.setActorOrder(turnOrder);
}

ServerMapFactory.prototype.mpCreateMap = async function(gameContext, settings) {
    const { pathHandler, mapRepository, world } = gameContext;
    const { mapManager } = world;
    const { mapID } = settings;
    const mapSource = mapRepository.getMapSource(mapID);
    const file = await mapSource.promiseFile(pathHandler);

    if(file !== null) {
        const { width, height, data } = file;
        const mapID = mapManager.getNextID();
        const worldMap = new BattalionMap(mapID, width, height);

        worldMap.setSource(mapSource);
        worldMap.decodeLayers(data);
        mapManager.addMap(worldMap);
        mapManager.enableMap(mapID);

        this.loadMap(gameContext, worldMap, file, settings);
    } 
}

export const MPMapSettings = function() {
    this.mapID = null;
    this.teams = {};
    this.entities = [];
    this.mode = MPMapSettings.MODE.PVP;
}

MPMapSettings.MODE = {
    COOP: 0,
    PVP: 1
};

MPMapSettings.prototype.addEntity = function(entityID) {
    this.entities.push(entityID);
}

MPMapSettings.prototype.toJSON = function() {
    return {
        "mapID": this.mapID,
        "teams": this.teams,
        "entities": this.entities,
        "mode": this.mode
    }
}