import { BattalionMap } from "../map/battalionMap.js";
import { spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
import { ClientBattalionEvent } from "../event/clientBattalionEvent.js";
import { ServerBattalionEvent } from "../event/serverBattalionEvent.js";
import { createActor, createPlayer, createSpectator, createTeam } from "../map/generic.js";
import { MapSettings } from "../map/settings.js";

export const ClientMapFactory = {
    mpClientCreateStaticMap: async function(gameContext, payload) {
        const { pathHandler, mapRegistry, world, language } = gameContext;
        const { mapManager } = world;
        const { settings, client, isSpectator } = payload;
        const { mapID } = settings;
        const mapSource = mapRegistry.getMapPreview(mapID);
        const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

        if(file !== null) {
            const { width, height, data } = file;
            const mapID = mapManager.getNextID();
            const worldMap = new BattalionMap(mapID, width, height);

            worldMap.decodeLayers(data);

            if(translations !== null) {
                language.registerMapTranslations(translations);
            }

            mapManager.addMap(worldMap);
            mapManager.enableMap(mapID);

            ClientMapFactory.loadMap(gameContext, worldMap, file, client, settings);
            
            if(isSpectator) {
                createSpectator(gameContext);
            }
        }
    },
    createStoryMap: async function(gameContext, settings) {
        const { pathHandler, mapRegistry, world, language } = gameContext;
        const { mapManager } = world;
        const { mapID } = settings;
        const mapSource = mapRegistry.getMapPreview(mapID);
        const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

        if(file !== null) {
            const { width, height, data, client } = file;
            const mapID = mapManager.getNextID();
            const worldMap = new BattalionMap(mapID, width, height);

            worldMap.decodeLayers(data);

            if(translations !== null) {
                language.registerMapTranslations(translations);
            }

            mapManager.addMap(worldMap);
            mapManager.enableMap(mapID);

            ClientMapFactory.loadMap(gameContext, worldMap, file, client, settings);
        }
    },
    createEditorMap: async function(gameContext, sourceID) {
        const { pathHandler, mapRegistry, world } = gameContext;
        const { mapManager } = world;
        const mapSource = mapRegistry.getMapPreview(sourceID);
        const file = await mapSource.promiseFile(pathHandler);

        if(file !== null) {
            const { width, height, data } = file;
            const mapID = mapManager.getNextID();
            const worldMap = new BattalionMap(mapID, width, height);

            worldMap.decodeLayers(data);
            mapManager.addMap(worldMap);
            mapManager.enableMap(mapID);
            
            return worldMap;
        }

        return null;
    },
    createEmptyMap: function(gameContext, width, height) {     
        const { world } = gameContext;
        const { mapManager } = world;
        const mapID = mapManager.getNextID();
        const worldMap = new BattalionMap(mapID, width, height);

        mapManager.addMap(worldMap);
        mapManager.enableMap(mapID);

        return worldMap;
    },
    applyTeamConfig: function(gameContext, team, config, settings, clientTeam) {
        const { teamManager } = gameContext;
        const { commander, allies = [] } = config;
        const { colors } = settings;
        const teamName = team.getID();
        const colorID = colors[teamName];

        if(colorID !== undefined) {
            team.setColor(gameContext, colorID);
        }

        for(const teamID of allies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        const actor = clientTeam === teamName ? createPlayer(gameContext, commander, teamName) : createActor(gameContext, commander, teamName);

        if(actor) {
            const actorID = actor.getID();

            team.setActor(actorID);
        }
    },
    loadMap: function(gameContext, worldMap, mapData, clientTeam, settings) {
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

        for(const teamName in teams) {
            const team = teamManager.getTeam(teamName);

            if(team) {
                ClientMapFactory.applyTeamConfig(gameContext, team, teams[teamName], settings, clientTeam);
            }
        }

        switch(settings.mode) {
            case MapSettings.MODE.STORY: {
                for(let i = 0; i < entities.length; i++) {
                    spawnClientEntity(gameContext, entities[i]);
                }  

                break;
            }
            case MapSettings.MODE.PVP: {
                const externalIDs = settings.entities;

                if(externalIDs.length === entities.length) {
                    for(let i = 0; i < entities.length; i++) {
                        spawnClientEntity(gameContext, entities[i], externalIDs[i]);
                    }
                }

                break;
            }
            default: {
                console.error("Unknown mode!");
                break;
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
};

export const ServerMapFactory = {
    mpCreateMap: async function(gameContext, settings) {
        const { pathHandler, mapRegistry, world } = gameContext;
        const { mapManager } = world;
        const { mapID } = settings;
        const mapSource = mapRegistry.getMapPreview(mapID);
        const file = await mapSource.promiseFile(pathHandler);

        if(file !== null) {
            const { width, height, data } = file;
            const mapID = mapManager.getNextID();
            const worldMap = new BattalionMap(mapID, width, height);

            worldMap.decodeLayers(data);
            mapManager.addMap(worldMap);
            mapManager.enableMap(mapID);

            ServerMapFactory.loadMap(gameContext, worldMap, file, settings);
        } 
    },
    createEvents: function(gameContext, events) {
        const { world } = gameContext;
        const { eventHandler } = world;

        for(const eventName in events) {
            const { turn, round, next = null, actions = [] } = events[eventName];
            const event = new ServerBattalionEvent(eventName, actions);

            event.setTriggerTime(turn, round);
            event.setNext(next);
            eventHandler.addEvent(event);
        }
    },
    spawnEntities: function(gameContext, entities, settings) {
        const { world } = gameContext;
        const { entityManager } = world; 

        for(let i = 0; i < entities.length; i++) {
            const entityID = entityManager.getNextID();
            
            spawnServerEntity(gameContext, entities[i], entityID);

            settings.addEntity(entityID);
        }
    },
    applyTeamConfig: function(gameContext, team, config, settings) {
        const { teamManager } = gameContext;
        const { commander, allies = [] } = config;
        const { colors } = settings;
        const teamName = team.getID();
        const colorID = colors[teamName];

        if(colorID !== undefined) {
            team.setColor(gameContext, colorID);
        }

        for(const teamID of allies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        const actor = createActor(gameContext, commander, teamName);

        if(actor) {
            team.setActor(actor.getID());
        }
    },
    loadMap: function(gameContext, worldMap, mapData, settings) {
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

        for(const teamName in teams) {
            const team = teamManager.getTeam(teamName);

            if(team) {
                ServerMapFactory.applyTeamConfig(gameContext, team, teams[teamName], settings);
            }
        }

        ServerMapFactory.spawnEntities(gameContext, entities, settings);

        for(let i = 0; i < buildings.length; i++) {
            spawnServerBuilding(gameContext, worldMap, buildings[i]);
        }
        
        ServerMapFactory.createEvents(gameContext, events);

        teamManager.updateStatus();

        const turnOrder = teamManager.getTurnOrder();

        turnManager.setActorOrder(turnOrder);
    }
};