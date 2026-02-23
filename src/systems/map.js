import { BattalionMap } from "../map/battalionMap.js";
import { createClientEntityObject, createMineObject, spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
import { MapSettings } from "../map/settings.js";
import { COMMANDER_TYPE, COMPONENT_TYPE, CURRENCY_TYPE, FACTION_TYPE, MINE_TYPE, OBJECTIVE_TYPE, SCHEMA_TYPE } from "../enums.js";
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
import { TeamManager } from "../team/teamManager.js";

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
    createActor: function(gameContext, teamID) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new BattalionActor(actorID);

        turnManager.addActor(actor);
        actor.setTeam(teamID);
        actor.setName("NPC");
    },
    createPlayer: function(gameContext, teamID, clientCamera) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new Player(actorID, clientCamera);

        turnManager.addActor(actor);
        actor.setTeam(teamID);
        actor.loadKeybinds(gameContext);
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
    applySettings: function(gameContext, teams, settings) {
        const { teamManager } = gameContext;
    
        for(let i = 0; i < teams.length; i++) {
            const teamConfig = teams[i];
            const team = teamManager.getTeam(i);

            //Overrides use the teams name (tID) as a reference, not the runtime ID.
            const tID = teamConfig.id ?? null;
            const override = settings.getOverride(tID);
            const oName = override.name ?? null;
            const oColor = override.color ?? null;

            if(oColor !== null) {
                team.createCustomSchema(oColor);
            }

            if(oName !== null) {
                team.setCustomName(oName);
            }
        }
    },
    createTeams: function(gameContext, teams, allObjectives) {
        const { typeRegistry, teamManager } = gameContext;

        for(let i = 0; i < teams.length; i++) {
            const teamConfig = teams[i];

            const tID = teamConfig.id ?? null;
            const tCash = teamConfig.cash ?? 0;
            const tFaction = teamConfig.faction ?? null;
            const tObjectives = teamConfig.objectives ?? [];
            const tColor = teamConfig.color ?? null;

            const team = teamManager.createTeam(tID);

            if(tFaction !== null) {
                const tFactionID = FACTION_TYPE[tFaction] ?? FACTION_TYPE.RED;

                team.loadAsFaction(gameContext, tFactionID);
            }

            if(tColor !== null) {
                const tColorID = SCHEMA_TYPE[tColor] ?? SCHEMA_TYPE.RED;
                const schemaType = typeRegistry.getSchemaType(tColorID);

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

        for(let i = 0; i < teams.length; i++) {
            const teamConfig = teams[i];
            const team = teamManager.getTeam(i);

            const tAllies = teamConfig.allies ?? [];
            const tCommander = teamConfig.commander ?? "NONE";
            const tCommanderID = COMMANDER_TYPE[tCommander] ?? COMMANDER_TYPE.NONE;

            for(const allyTeamName of tAllies) {
                const allyTeamID = teamManager.getTeamID(allyTeamName);
                const allyTeam = teamManager.getTeam(allyTeamID);

                if(allyTeam) {
                    team.addAlly(allyTeamID);
                    allyTeam.addAlly(i); //i MUST be the correct id.
                }
            }

            team.loadCommander(gameContext, tCommanderID);
        }
    }
};

export const ClientMatchLoader = function(worldMap, mapFile) {
    this.worldMap = worldMap;
    this.music = mapFile.music ?? "rivers_of_steel";
    this.playlist = mapFile.playlist ?? null;
    this.teams = mapFile.teams ?? [];
    this.entities = mapFile.entities ?? [];
    this.objectives = mapFile.objectives ?? {};
    this.events = mapFile.events ?? {};
    this.buildings = mapFile.buildings ?? [];
    this.localization = mapFile.localization ?? [];
    this.prelogue = mapFile.prelogue ?? [];
    this.postlogue = mapFile.postlogue ?? [];
    this.defeat = mapFile.defeat ?? [];
    this.clientTeam = mapFile.client ?? null;
    this.mode = ClientMatchLoader.MODE.CUSTOM;
}

ClientMatchLoader.MODE = {
    CUSTOM: 0,
    PVE: 1,
    PVP: 2
};

ClientMatchLoader.prototype.setMode = function(mode) {
    this.mode = mode;
}

ClientMatchLoader.prototype.createActors = function(gameContext, camera) {
    const { teamManager } = gameContext;
    const clientTeamID = teamManager.getTeamID(this.clientTeam);

    //If no client team is found, assume they're a spectator.
    if(clientTeamID === TeamManager.INVALID_ID) {
        ActorFactory.createSpectator(gameContext, camera);
    }

    teamManager.forEachTeam((team) => {
        const { id, allies } = team;

        if(id === clientTeamID) {
            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            ActorFactory.createPlayer(gameContext, id, camera);

            camera.addPerspective(id);

            //Adds all allies as perspective. This allows the client to see allied stealth units.
            for(const allyID of allies) {
                camera.addPerspective(allyID)
            }
        } else {
            ActorFactory.createActor(gameContext, id);
        }
    });
}

ClientMatchLoader.prototype.createBuildings = function(gameContext) {
    switch(this.mode) {
        case ClientMatchLoader.MODE.CUSTOM: {
            //Custom loader called in between.
            break;
        }
        case ClientMatchLoader.MODE.PVE:
        case ClientMatchLoader.MODE.PVP: {
            for(const building of this.buildings) {
                spawnClientBuilding(gameContext, this.worldMap, building); 
            }

            break;
        }
        default: {
            console.error("Unknown mode!");
            break;
        }
    }
}

ClientMatchLoader.prototype.createEntities = function(gameContext, settings) {
    switch(this.mode) {
        case ClientMatchLoader.MODE.CUSTOM: {
            //Custom loader called in between.
            break;
        }
        case ClientMatchLoader.MODE.PVE: {
            for(const entity of this.entities) {
                spawnClientEntity(gameContext, entity);
            }

            break;
        }
        case ClientMatchLoader.MODE.PVP: {
            const externalIDs = settings.entities;

            if(externalIDs.length === this.entities.length) {
                for(let i = 0; i < this.entities.length; i++) {
                    spawnClientEntity(gameContext, this.entities[i], externalIDs[i]);
                }
            }

            break;
        }
        default: {
            console.error("Unknown mode!");
            break;
        }
    }
}

ClientMatchLoader.prototype.createMines = function(gameContext) {
    //TODO: TEST
    this.worldMap.addMine(createMineObject(gameContext, -1, MINE_TYPE.LAND, 6, 3));
}

ClientMatchLoader.prototype.loadMusic = function(gameContext) {
    const { client } = gameContext;
    const { musicPlayer } = client;

    if(this.playlist) {
        musicPlayer.playPlaylist(this.playlist);
    } else {
        musicPlayer.play(this.music);
    }
}

ClientMatchLoader.prototype.getAllowedComponents = function() {
    switch(this.mode) {
        case ClientMatchLoader.MODE.CUSTOM: return CLIENT_EVENT_COMPONENTS;
        case ClientMatchLoader.MODE.PVE: return CLIENT_EVENT_COMPONENTS;
        case ClientMatchLoader.MODE.PVP: return MP_CLIENT_EVENT_COMPONENTS;
        default: return CLIENT_EVENT_COMPONENTS;
    }
}

ClientMatchLoader.prototype.loadMap = function(gameContext, settings) {
    const { dialogueHandler } = gameContext;
    const cContext = createPlayCamera(gameContext);
    const camera = cContext.getCamera();
    const allowedComponents = this.getAllowedComponents();

    TeamFactory.createTeams(gameContext, this.teams, this.objectives);
    TeamFactory.applySettings(gameContext, this.teams, settings);

    this.createActors(gameContext, camera);
    this.createEntities(gameContext, settings);
    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.worldMap.loadLocalization(this.localization);

    EventFactory.createWorldEvents(gameContext, this.events, allowedComponents);
    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);   
}

ClientMatchLoader.prototype.startGame = function(gameContext) {
    const { teamManager } = gameContext;
    
    teamManager.updateStatus();
    teamManager.setTurnOrder(gameContext);

    //Enqueue start turn action.
}

export const ClientMapLoader = {
    createStoryLoader: async function(gameContext, sourceID) {
        const { pathHandler, mapRegistry, world, language } = gameContext;
        const { mapManager } = world;
        const mapSource = mapRegistry.getMapPreview(sourceID);
        const [file, translations] = await Promise.all([mapSource.promiseFile(pathHandler), mapSource.promiseTranslations(pathHandler)]);

        if(file === null) {
            return null;
        }

        const { width, height, data } = file;
        const nextID = mapManager.getNextID();
        const worldMap = new BattalionMap(nextID, width, height, sourceID);

        worldMap.decodeLayers(data);

        if(translations !== null) {
            language.registerMapTranslations(translations);
        }

        mapManager.addMap(worldMap);
        mapManager.enableMap(nextID);

        return new ClientMatchLoader(worldMap, file);
    },
    createEditorMap: async function(gameContext, sourceID) {
        const { pathHandler, mapRegistry, world } = gameContext;
        const { mapManager } = world;
        const mapSource = mapRegistry.getMapPreview(sourceID);
        const file = await mapSource.promiseFile(pathHandler);

        if(file !== null) {
            const { width, height, data } = file;
            const nextID = mapManager.getNextID();
            const worldMap = new BattalionMap(nextID, width, height, sourceID);

            worldMap.decodeLayers(data);
            mapManager.addMap(worldMap);
            mapManager.enableMap(nextID);
            
            return worldMap;
        }

        return null;
    },
    createEmptyMap: function(gameContext, width, height) {     
        const { world } = gameContext;
        const { mapManager } = world;
        const nextID = mapManager.getNextID();
        const worldMap = new BattalionMap(nextID, width, height, null);

        mapManager.addMap(worldMap);
        mapManager.enableMap(nextID);

        return worldMap;
    }
};

export const ServerMapLoader = {
    mpCreateMap: async function(gameContext, sourceID, settings) {
        const { pathHandler, mapRegistry, world } = gameContext;
        const { mapManager } = world;
        const mapSource = mapRegistry.getMapPreview(sourceID);
        const file = await mapSource.promiseFile(pathHandler);

        if(file !== null) {
            const { width, height, data } = file;
            const nextID = mapManager.getNextID();
            const worldMap = new BattalionMap(nextID, width, height, sourceID);

            worldMap.decodeLayers(data);
            mapManager.addMap(worldMap);
            mapManager.enableMap(nextID);

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
    createActors: function(gameContext) {
        const { teamManager } = gameContext;

        teamManager.forEachTeam((team) => {
            const { id } = team;

            ActorFactory.createActor(gameContext, id);
        })
    },
    loadMap: function(gameContext, worldMap, mapData, settings) {
        const { teamManager } = gameContext;
        const { 
            teams = [],
            entities = [],
            objectives = {},
            events = {},
            buildings = []
        } = mapData;

        TeamFactory.createTeams(gameContext, teams, objectives);
        TeamFactory.applySettings(gameContext, teams, settings);
        ServerMapLoader.createActors(gameContext);
        ServerMapLoader.spawnEntities(gameContext, entities, settings);

        for(let i = 0; i < buildings.length; i++) {
            spawnServerBuilding(gameContext, worldMap, buildings[i]);
        }
        
        EventFactory.createWorldEvents(gameContext, events, MP_SERVER_EVENT_COMPONENTS);

        teamManager.updateStatus();
        teamManager.setTurnOrder(gameContext);
    }
};