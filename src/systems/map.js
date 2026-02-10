import { BattalionMap } from "../map/battalionMap.js";
import { spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
import { createActor, createPlayer, createSpectator, createTeam } from "../map/generic.js";
import { MapSettings } from "../map/settings.js";
import { COMPONENT_TYPE } from "../enums.js";
import { Mine } from "../entity/mine.js";
import { DialogueComponent } from "../event/components/dialogue.js";
import { ExplodeTileComponent } from "../event/components/explodeTile.js";
import { PlayEffectComponent } from "../event/components/playEffect.js";
import { SpawnComponent } from "../event/components/spawn.js";
import { WorldEvent } from "../../engine/world/event/worldEvent.js";
import { createPlayCamera } from "./camera.js";

const MP_SERVER_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.EXPLODE_TILE, COMPONENT_TYPE.SPAWN_ENTITY]);
const MP_CLIENT_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.DIALOGUE, COMPONENT_TYPE.PLAY_EFFECT]);
const CLIENT_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.DIALOGUE, COMPONENT_TYPE.PLAY_EFFECT, COMPONENT_TYPE.SPAWN_ENTITY, COMPONENT_TYPE.EXPLODE_TILE]);

const createComponents = function(components, allowedComponents) {
    const componentObjects = [];

    for(let i = 0; i < components.length; i++) {
        const { type } = components[i];

        if(!allowedComponents.has(type)) {
            continue;
        }

        switch(type) {
            case COMPONENT_TYPE.DIALOGUE: {
                const { dialogue, target = null } = components[i];
                const component = new DialogueComponent(dialogue, target);

                componentObjects.push(component);
                break;
            }
            case COMPONENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = components[i];
                const component = new ExplodeTileComponent(layer, x, y);

                componentObjects.push(component);
                break;
            }
            case COMPONENT_TYPE.PLAY_EFFECT: {
                const { effects } = components[i];
                const component = new PlayEffectComponent(effects);

                componentObjects.push(component);
                break;
            }
            case COMPONENT_TYPE.SPAWN_ENTITY: {
                const { entities } = components[i];
                const component = new SpawnComponent(entities);

                componentObjects.push(component);
                break;
            }
            default: {
                console.error("Unsupported event component!", config[i]);
                break;
            }
        }
    }

    return componentObjects;
}

const createWorldEvents = function(gameContext, events, allowedComponents) {
    const { world } = gameContext;
    const { eventHandler } = world;

    for(const eventName in events) {
        const { turn, round, next = null, components = [] } = events[eventName];
        const componentObjects = createComponents(components, allowedComponents);
        const event = new WorldEvent(eventName, componentObjects);

        event.setTriggerTime(turn, round);
        event.setNext(next);
        eventHandler.addEvent(event);
    }
}

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

            ClientMapFactory.loadMap(gameContext, worldMap, file, client, settings, MP_CLIENT_EVENT_COMPONENTS);
            
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

            const testmine = new Mine({});
            testmine.setTile(6, 3);
            worldMap.addMine(testmine);

            if(translations !== null) {
                language.registerMapTranslations(translations);
            }

            mapManager.addMap(worldMap);
            mapManager.enableMap(mapID);

            ClientMapFactory.loadMap(gameContext, worldMap, file, client, settings, CLIENT_EVENT_COMPONENTS);
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
    applyTeamConfig: function(gameContext, team, config, settings, clientTeam, clientCamera) {
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

        //Each client SHOULD have a team.
        //If not, the client camera renders with no perspective.
        if(clientTeam === teamName) {
            createPlayer(gameContext, commander, teamName, clientCamera);

            clientCamera.addPerspective(teamName);
            clientCamera.setMainPerspective(teamName); //TODO [HOTSEAT]: Change perspective depending on the current actor.

            //Add all allies as perspective. This allows the client to see allied stealth units.
            for(let i = 0; i < team.allies.length; i++) {
                clientCamera.addPerspective(team.allies[i]);
            }
        } else {
            createActor(gameContext, commander, teamName);
        }
    },
    loadMap: function(gameContext, worldMap, mapData, clientTeam, settings, allowedComponents) {
        const { teamManager, dialogueHandler, client } = gameContext;
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

        const cContext = createPlayCamera(gameContext);
        const camera = cContext.getCamera();
    
        for(const teamName in teams) {
            createTeam(gameContext, teamName, teams[teamName], objectives);
        }

        for(const teamName in teams) {
            const team = teamManager.getTeam(teamName);

            if(team) {
                ClientMapFactory.applyTeamConfig(gameContext, team, teams[teamName], settings, clientTeam, camera);
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
        createWorldEvents(gameContext, events, allowedComponents);
        dialogueHandler.loadMapDialogue(prelogue, postlogue, defeat);        
        teamManager.updateStatus();
        teamManager.setTurnOrder(gameContext);
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

        createActor(gameContext, commander, teamName);
    },
    loadMap: function(gameContext, worldMap, mapData, settings) {
        const { teamManager } = gameContext;
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
        
        createWorldEvents(gameContext, events, MP_SERVER_EVENT_COMPONENTS);

        teamManager.updateStatus();
        teamManager.setTurnOrder(gameContext);
    }
};