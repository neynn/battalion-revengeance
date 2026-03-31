import { BattalionMap } from "../map/battalionMap.js";
import { createClientBuildingObject, createClientEntityObject, createMineObject, createServerEntityObject, spawnClientBuilding, spawnServerBuilding } from "./spawn.js";
import { COMMANDER_TYPE, COMPONENT_TYPE, CURRENCY_TYPE, FACTION_TYPE, LAYER_TYPE, LOADER_RULE, MINE_TYPE, OBJECTIVE_TYPE, SCHEMA_TYPE } from "../enums.js";
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
import { PlayUI } from "../ui/playUI.js";
import { createEntitySnapshotFromJSON } from "../snapshot/entitySnapshot.js";
import { ServerActor } from "../actors/serverActor.js";

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
    createServerActor: function(gameContext, teamID, clientID) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new ServerActor(actorID);

        turnManager.addActor(actor);
        actor.setTeam(teamID);
        actor.setName("Server");
        actor.clientID = clientID;
    },
    createActor: function(gameContext, teamID) {
        const { world } = gameContext;
        const { turnManager } = world;
        const actorID = turnManager.getNextID();
        const actor = new BattalionActor(actorID);

        turnManager.addActor(actor);
        actor.setTeam(teamID);
        actor.setName("NPC");
    },
    createPlayer: function(gameContext, teamID) {
        const { world } = gameContext;
        const { turnManager } = world;
        const context = createPlayCamera(gameContext);
        const actorID = turnManager.getNextID();
        const actor = new Player(actorID, context.getCamera());
        const playUI = new PlayUI(actor.inspector, context, gameContext);

        playUI.load(gameContext);
        turnManager.addActor(actor);
        actor.setTeam(teamID);
        actor.loadKeybinds(gameContext);
        actor.states.setNextState(gameContext, Player.STATE.IDLE);
        actor.setName("PLAYER");
    },
    createSpectator: function(gameContext) {
        const { world } = gameContext;
        const { turnManager } = world;
        const context = createPlayCamera(gameContext);
        const actorID = turnManager.getNextID();
        const actor = new Spectator(actorID, context.getCamera());
        const playUI = new PlayUI(actor.inspector, context, gameContext);

        playUI.load(gameContext);
        turnManager.addActor(actor);
        actor.loadKeybinds(gameContext);
        actor.setName("SPECTATOR");
    }
};

const ObjectiveFactory = {
    createObjective: function(config, worldMap) {
        switch(config.type) {
            case OBJECTIVE_TYPE.DEFEAT: {
                const objective = new DefeatObjective();
                const targetID = worldMap.getCustomID(config.target);

                if(targetID !== BattalionMap.INVALID_CUSTOM_ID) {
                    objective.targetID = targetID;
                }

                return objective;
            }
            case OBJECTIVE_TYPE.PROTECT: {
                const objective = new ProtectObjective();

                for(const targetName of config.targets) {
                    const targetID = worldMap.getCustomID(targetName);

                    if(targetID !== BattalionMap.INVALID_CUSTOM_ID) {
                        objective.addTarget(targetID);
                    }
                }

                return objective;
            }
            case OBJECTIVE_TYPE.CAPTURE: return new CaptureObjective(config.tiles);
            case OBJECTIVE_TYPE.DEFEND: return new DefendObjective(config.tiles);
            case OBJECTIVE_TYPE.SURVIVE: return new SurviveObjective(config.turn);
            case OBJECTIVE_TYPE.TIME_LIMIT: return new TimeLimitObjective(config.turn);
            default: return new ErrorObjective();
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
    this.mines = mapFile.mines ?? [];
    this.localization = mapFile.localization ?? [];
    this.prelogue = mapFile.prelogue ?? [];
    this.postlogue = mapFile.postlogue ?? [];
    this.defeat = mapFile.defeat ?? [];
    this.clientTeam = mapFile.client ?? null;
    this.rules = LOADER_RULE.NONE;
}

ClientMatchLoader.prototype.createCustomSchema = function(gameContext, team, colorMap) {
    const { typeRegistry } = gameContext;
    const { id } = team;
    const colorID = SCHEMA_TYPE.CUSTOM_1 + id; //TeamID from 0 to n (max 8).
    const schema = typeRegistry.getSchemaType(colorID);

    schema.reset();
    schema.loadCustom(colorMap);

    team.color = colorID;
}

ClientMatchLoader.prototype.createTeams = function(gameContext, overrides) {
    const { teamManager } = gameContext;

    for(let i = 0; i < this.teams.length; i++) {
        const { 
            id = null,
            cash = 0,
            faction = null,
            objectives = [],
            color = null,
            commander = null
        } = this.teams[i];

        const team = teamManager.createTeam(id);

        if(commander !== null) {
            team.commander = COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE;
        }

        if(faction !== null) {
            const factionID = FACTION_TYPE[faction] ?? FACTION_TYPE.RED;

            team.loadAsFaction(gameContext, factionID);
        }

        if(color !== null) {
            team.color = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;
        }

        //The map may have a preset cash for each team.
        team.cash = cash;

        //Most game modes have objectives, except custom PvP.
        if(this.rules & LOADER_RULE.LOAD_OBJECTIVES) {
            for(const objectiveID of objectives) {
                const config = this.objectives[objectiveID];

                if(config) {
                    const objective = ObjectiveFactory.createObjective(config, this.worldMap);

                    team.addObjective(objective);
                }
            }
        }
    }

    //When allies are fixed, the map determines them.
    if(this.rules & LOADER_RULE.FIXED_ALLIES) {
        for(let i = 0; i < this.teams.length; i++) {
            const {
                allies = []
            } = this.teams[i];

            teamManager.loadAllies(i, allies);
        }
    }

    for(const override of overrides) {
        const { team, color, name, allies } = override;
        const teamID = teamManager.getTeamID(team);
        const teamObject = teamManager.getTeam(teamID);

        if(teamObject) {
            if(name !== null) {
                //Names can always be overridden!
                teamObject.setCustomName(name);
            }

            if(color !== null) {
                //Colors can always be overridden!
                this.createCustomSchema(gameContext, teamObject, color);
            }

            //In dynamic PvP games, the allies are set by the overrides.
            if(!(this.rules & LOADER_RULE.FIXED_ALLIES)) {
                teamManager.loadAllies(teamID, allies);
            }
        }
    }
}

ClientMatchLoader.prototype.createActors = function(gameContext) {
    const { teamManager } = gameContext;
    const clientTeamID = teamManager.getTeamID(this.clientTeam);

    if(this.rules & LOADER_RULE.ALLOW_SPECTATOR) {
        //If no client team is found, assume they're a spectator.
        if(clientTeamID === TeamManager.INVALID_ID) {
            ActorFactory.createSpectator(gameContext);
        }
    }

    teamManager.forEachTeam((team) => {
        const { id } = team;

        if(id === clientTeamID) {
            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            ActorFactory.createPlayer(gameContext, id);
        } else {
            ActorFactory.createActor(gameContext, id);
        }
    });
}

ClientMatchLoader.prototype.createBuildings = function(gameContext) {
    for(const building of this.buildings) {
        spawnClientBuilding(gameContext, this.worldMap, building); 
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
    const { teamManager, world } = gameContext;
    const { turnManager } = world;
    const { team, rounds, turns } = turn;
    const actor = teamManager.findActorByTeam(gameContext, team);

    turnManager.globalRound = rounds;
    teamManager.globalTurn = turns;

    if(actor) {
        turnManager.setCurrentActor(gameContext, actor.getID());
    }
}

ClientMatchLoader.prototype.loadInitialServerSnapshot = function(gameContext, snapshot, overrides) {
    const { dialogueHandler, teamManager, spriteManager } = gameContext;
    const { mapID, turn, entities, teams } = snapshot; //TODO(neyn): Colors to team overrides!

    this.rules |= LOADER_RULE.ALLOW_SPECTATOR;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);

    for(const { id, data } of entities) {
        createClientEntityObject(gameContext, id, data);
    }

    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.worldMap.loadLocalization(this.localization);

    EventFactory.createWorldEvents(gameContext, this.events, MP_CLIENT_EVENT_COMPONENTS);
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
        const { type, tileX, tileY, teamID, color } = blob;
        const building = createClientBuildingObject(gameContext, teamID, type, tileX, tileY, color);

        building.load(blob);
        this.worldMap.addBuilding(building);
    }

    for(const blob of entities) {
        const nextID = entityManager.getNextID();

        createClientEntityObject(gameContext, nextID, blob);
    }

    this.loadMusic(gameContext);
    this.worldMap.loadLocalization(this.localization);
    this.worldMap.loadEdits(edits);

    EventFactory.createWorldEvents(gameContext, this.events, CLIENT_EVENT_COMPONENTS);
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

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.createBuildings(gameContext);
    this.createMines(gameContext);
    this.loadMusic(gameContext);
    this.worldMap.loadLocalization(this.localization);

    EventFactory.createWorldEvents(gameContext, this.events, CLIENT_EVENT_COMPONENTS);
    dialogueHandler.loadMapDialogue(this.prelogue, this.postlogue, this.defeat);
    teamManager.updateStatus();
    teamManager.setTurnOrder(gameContext);

    //Sort buildings once after all are created!
    spriteManager.sortLayer(LAYER_TYPE.BUILDING);
}

export const ServerMatchLoader = function(worldMap, mapFile) {
    this.worldMap = worldMap;
    this.teams = mapFile.teams ?? [];
    this.entities = mapFile.entities ?? [];
    this.objectives = mapFile.objectives ?? {};
    this.events = mapFile.events ?? {};
    this.buildings = mapFile.buildings ?? [];
    this.mines = mapFile.mines ?? [];
    this.rules = LOADER_RULE.NONE;
}

ServerMatchLoader.prototype.createTeams = function(gameContext, overrides) {
    const { typeRegistry, teamManager } = gameContext;

    for(let i = 0; i < this.teams.length; i++) {
        const { 
            id = null,
            cash = 0,
            faction = null,
            objectives = [],
            color = null,
            commander = null
        } = this.teams[i];

        const team = teamManager.createTeam(id);

        if(commander !== null) {
            team.commander = COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE;
        }

        if(faction !== null) {
            const factionID = FACTION_TYPE[faction] ?? FACTION_TYPE.RED;

            team.loadAsFaction(gameContext, factionID);
        }

        if(color !== null) {
            team.color = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;
        }

        //The map may have a preset cash for each team.
        team.cash = cash;

        //Most game modes have objectives, except custom PvP.
        if(this.rules & LOADER_RULE.LOAD_OBJECTIVES) {
            for(const objectiveID of objectives) {
                const config = this.objectives[objectiveID];

                if(config) {
                    const objective = ObjectiveFactory.createObjective(config, this.worldMap);

                    team.addObjective(objective);
                }
            }
        }
    }

    //When allies are fixed, the map determines them.
    if(this.rules & LOADER_RULE.FIXED_ALLIES) {
        for(let i = 0; i < this.teams.length; i++) {
            const {
                allies = []
            } = this.teams[i];

            teamManager.loadAllies(i, allies);
        }
    }

    //Custom colors are NOT modified on the server as each instance shares types.
    for(const override of overrides) {
        const { team, name, allies } = override;
        const teamID = teamManager.getTeamID(team);
        const teamObject = teamManager.getTeam(teamID);

        if(teamObject) {
            if(name !== null) {
                //Names can always be overridden!
                teamObject.setCustomName(name);
            }

            //In dynamic PvP games, the allies are set by the overrides.
            if(!(this.rules & LOADER_RULE.FIXED_ALLIES)) {
                teamManager.loadAllies(teamID, allies);
            }
        }
    }
}

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

        ActorFactory.createServerActor(gameContext, id, client);
    })
}

ServerMatchLoader.prototype.createBuildings = function(gameContext) {
    for(const building of this.buildings) {
        spawnServerBuilding(gameContext, this.worldMap, building); 
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

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.createBuildings(gameContext);
    this.createMines(gameContext);

    EventFactory.createWorldEvents(gameContext, this.events, MP_SERVER_EVENT_COMPONENTS);

    teamManager.updateStatus();
    teamManager.setTurnOrder(gameContext);
}

export const createEditorMap = async function(gameContext, sourceID) {
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
    const worldMap = new BattalionMap(nextID, width, height, sourceID);

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
    const worldMap = new BattalionMap(nextID, width, height, sourceID);

    worldMap.createTextMapping(text);
    worldMap.createCustomMapping(custom);
    worldMap.decodeLayers(data);
    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return new ServerMatchLoader(worldMap, file);
}