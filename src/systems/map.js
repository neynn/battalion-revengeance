import { BattalionMap } from "../map/battalionMap.js";
import { spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
import { MapSettings } from "../map/settings.js";
import { COMPONENT_TYPE, CURRENCY_TYPE, OBJECTIVE_TYPE, SCHEMA_TYPE } from "../enums.js";
import { Mine } from "../entity/mine.js";
import { DialogueComponent } from "../event/components/dialogue.js";
import { ExplodeTileComponent } from "../event/components/explodeTile.js";
import { PlayEffectComponent } from "../event/components/playEffect.js";
import { SpawnComponent } from "../event/components/spawn.js";
import { WorldEvent } from "../../engine/world/event/worldEvent.js";
import { createPlayCamera } from "./camera.js";
import { BattalionActor } from "../actors/battalionActor.js";
import { Player } from "../actors/player.js";
import { Spectator } from "../actors/spectator.js";
import { DefeatObjective } from "../team/objective/types/defeat.js";
import { ProtectObjective } from "../team/objective/types/protect.js";
import { CaptureObjective } from "../team/objective/types/capture.js";
import { DefendObjective } from "../team/objective/types/defend.js";
import { SurviveObjective } from "../team/objective/types/survive.js";
import { TimeLimitObjective } from "../team/objective/types/timeLimit.js";
import { ErrorObjective } from "../team/objective/types/error.js";

const MP_SERVER_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.EXPLODE_TILE, COMPONENT_TYPE.SPAWN_ENTITY]);
const MP_CLIENT_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.DIALOGUE, COMPONENT_TYPE.PLAY_EFFECT]);
const CLIENT_EVENT_COMPONENTS = new Set([COMPONENT_TYPE.DIALOGUE, COMPONENT_TYPE.PLAY_EFFECT, COMPONENT_TYPE.SPAWN_ENTITY, COMPONENT_TYPE.EXPLODE_TILE]);

const EventFactory = {
    createComponents: function(components, allowedComponents) {
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
    },
    createWorldEvents: function(gameContext, events, allowedComponents) {
        const { world } = gameContext;
        const { eventHandler } = world;

        for(const eventName in events) {
            const { turn, round, next = null, components = [] } = events[eventName];
            const componentObjects = EventFactory.createComponents(components, allowedComponents);
            const event = new WorldEvent(eventName, componentObjects);

            event.setTriggerTime(turn, round);
            event.setNext(next);
            eventHandler.addEvent(event);
        }
    }
};

const ActorFactory = {
    createActor: function(gameContext, commanderType, teamName) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new BattalionActor(actorID);

        turnManager.addActor(actor);
        actor.setTeam(teamName);
        actor.loadCommander(gameContext, commanderType);
        actor.setName("NPC");
    },
    createPlayer: function(gameContext, commanderType, teamName, clientCamera) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new Player(actorID, clientCamera);

        turnManager.addActor(actor);
        actor.setTeam(teamName);
        actor.loadKeybinds(gameContext);
        actor.loadCommander(gameContext, commanderType);
        actor.states.setNextState(gameContext, Player.STATE.IDLE);
        actor.setName("PLAYER");
    },
    createSpectator: function(gameContext, clientCamera) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new Spectator(actorID, clientCamera);

        turnManager.addActor(actor);
        actor.loadKeybinds(gameContext);
        actor.setName("SPECTATOR");
    }
};

const ObjectiveFactory = {
    createObjective: function(config) {
        switch(config.type) {
            case OBJECTIVE_TYPE.DEFEAT: return new DefeatObjective(config.target);
            case OBJECTIVE_TYPE.PROTECT: return new ProtectObjective(config.targets);
            case OBJECTIVE_TYPE.CAPTURE: return new CaptureObjective(config.tiles);
            case OBJECTIVE_TYPE.DEFEND: return new DefendObjective(config.tiles);
            case OBJECTIVE_TYPE.SURVIVE: return new SurviveObjective(config.turn);
            case OBJECTIVE_TYPE.TIME_LIMIT: return new TimeLimitObjective(config.turn);
            default: return new ErrorObjective();
        }
    }
};

const TeamFactory = {
    createTeams: function(gameContext, teams, settings, allObjectives, onActorCreate) {
        const { typeRegistry, teamManager } = gameContext;

        for(const teamName in teams) {
            const team = teamManager.createTeam(teamName);

            if(!team) {
                continue;
            }

            const teamConfig = teams[teamName];
            const override = settings.getOverride(teamName);

            const tCash = teamConfig.cash ?? 0;
            const tFaction = teamConfig.faction ?? null;
            const tObjectives = teamConfig.objectives ?? [];
            const tColor = teamConfig.color ?? null;
            const tName = override.name ?? null;
            const oColor = override.color ?? null;

            if(tFaction !== null) {
                team.loadAsFaction(gameContext, tFaction);
            }

            if(oColor !== null) {
                team.createCustomSchema(oColor);
            } else if(tColor !== null) {
                const schemaType = typeRegistry.getSchemaType(tColor);

                team.schema = schemaType;
            }

            //If NO faction, NO oColor and NO tColor was given, fall back to RED.
            //Assume that schema is always not null after this point.
            if(!team.schema) {
                const schemaType = typeRegistry.getSchemaType(SCHEMA_TYPE.RED);

                team.schema = schemaType;
            }

            if(!team.currency) {
                team.currency = typeRegistry.getCurrencyType(CURRENCY_TYPE.NONE);
            }

            if(tName !== null) {
                team.setCustomName(tName);
            }

            //The map may have a preset cash for each team.
            team.cash = tCash;

            for(const objectiveID of tObjectives) {
                const config = allObjectives[objectiveID];

                if(config) {
                    const objective = ObjectiveFactory.createObjective(config);

                    team.addObjective(objective);
                }
            }
        }

        for(const teamName in teams) {
            const team = teamManager.getTeam(teamName);

            if(!team) {
                continue;
            }

            const teamConfig = teams[teamName];
            const tAllies = teamConfig.allies ?? [];
            const tCommander = teamConfig.commander ?? null;

            for(const teamID of tAllies) {
                const allyTeam = teamManager.getTeam(teamID);

                if(allyTeam) {
                    team.addAlly(teamID);
                    allyTeam.addAlly(teamName);
                }
            }

            onActorCreate(team, tCommander);
        }
    }
};

export const ClientMapLoader = {
    mpClientCreateStaticMap: async function(gameContext, settings, client, isSpectator) {
        const { pathHandler, mapRegistry, world, language } = gameContext;
        const { mapManager } = world;
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

            const cContext = createPlayCamera(gameContext);
            const camera = cContext.getCamera();

            ClientMapLoader.loadMap(gameContext, worldMap, file, client, settings, MP_CLIENT_EVENT_COMPONENTS, camera);
            
            if(isSpectator) {
                ActorFactory.createSpectator(gameContext, camera);
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

            const cContext = createPlayCamera(gameContext);
            const camera = cContext.getCamera();

            ClientMapLoader.loadMap(gameContext, worldMap, file, client, settings, CLIENT_EVENT_COMPONENTS, camera);
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
    loadMap: function(gameContext, worldMap, mapData, clientTeam, settings, allowedComponents, camera) {
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

        TeamFactory.createTeams(gameContext, teams, settings, objectives, (team, commanderType) => {
            const { id, allies } = team;

            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            if(clientTeam === id) {
                ActorFactory.createPlayer(gameContext, commanderType, id, camera);

                camera.addPerspective(id);

                //Adds all allies as perspective. This allows the client to see allied stealth units.
                for(let i = 0; i < allies.length; i++) {
                    camera.addPerspective(allies[i]);
                }
            } else {
                ActorFactory.createActor(gameContext, commanderType, id);
            }
        });

        switch(settings.mode) {
            case MapSettings.MODE.STORY: {
                for(let i = 0; i < entities.length; i++) {
                    spawnClientEntity(gameContext, entities[i]);
                }  

                break;
            }
            case MapSettings.MODE.PVP: {
                const externalIDs = settings.entities;

                //Only spawn entities if all have been set by the server.
                //This ensures a linked id.
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

        EventFactory.createWorldEvents(gameContext, events, allowedComponents);
     
        teamManager.updateStatus();
        teamManager.setTurnOrder(gameContext);
    }
};

export const ServerMapLoader = {
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

            ServerMapLoader.loadMap(gameContext, worldMap, file, settings);
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
    applyTeamConfig: function(gameContext, team, config) {
        const { teamManager } = gameContext;
        const { commander, allies = [] } = config;
        const teamName = team.getID();

        for(const teamID of allies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        ActorFactory.createActor(gameContext, commander, teamName);
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

        TeamFactory.createTeams(gameContext, teams, settings, objectives, (team, commanderType) => {
            const { id } = team;

            ActorFactory.createActor(gameContext, commanderType, id);
        });

        ServerMapLoader.spawnEntities(gameContext, entities, settings);

        for(let i = 0; i < buildings.length; i++) {
            spawnServerBuilding(gameContext, worldMap, buildings[i]);
        }
        
        EventFactory.createWorldEvents(gameContext, events, MP_SERVER_EVENT_COMPONENTS);

        teamManager.updateStatus();
        teamManager.setTurnOrder(gameContext);
    }
};