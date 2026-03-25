import { BattalionMap } from "../map/battalionMap.js";
import { createClientBuildingObject, createClientEntityObject, createMineObject, spawnClientBuilding, spawnClientEntity, spawnServerBuilding, spawnServerEntity } from "./spawn.js";
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
import { BattalionEntity } from "../entity/battalionEntity.js";
import { updateEntitySprite } from "./sprite.js";

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

ClientMatchLoader.prototype.createCustomSchema = function(gameContext, team, color) {
    const { typeRegistry } = gameContext;
    const { id, name } = team;
    const schemaID = SCHEMA_TYPE.CUSTOM_1 + id; //TeamID from 0 to n (max 8).
    const schema = typeRegistry.getSchemaType(schemaID);

    schema.reset();
    schema.loadCustom(name, "SCHEMA_DESC_CUSTOM", color);

    team.schema = schema;
}

ClientMatchLoader.prototype.createTeams = function(gameContext, overrides) {
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
            const commanderID = COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE;

            team.loadCommander(gameContext, commanderID);
        }

        if(faction !== null) {
            const factionID = FACTION_TYPE[faction] ?? FACTION_TYPE.RED;

            team.loadAsFaction(gameContext, factionID);
        }

        if(color !== null) {
            const colorID = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;
            const schemaType = typeRegistry.getSchemaType(colorID);

            team.schema = schemaType;
        }

        //Assume that schema is always not null after this point.
        if(!team.schema) {
            const schemaType = typeRegistry.getSchemaType(SCHEMA_TYPE.RED);

            team.schema = schemaType;
        }

        //Assume that currency is always not null after this point.
        if(!team.currency) {
            team.currency = typeRegistry.getCurrencyType(CURRENCY_TYPE.NONE);
        }

        //The map may have a preset cash for each team.
        team.cash = cash;

        //Most game modes have objectives, except custom PvP.
        if(this.rules & LOADER_RULE.LOAD_OBJECTIVES) {
            for(const objectiveID of objectives) {
                const config = this.objectives[objectiveID];

                if(config) {
                    const objective = ObjectiveFactory.createObjective(config);

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

ClientMatchLoader.prototype.createActors = function(gameContext, camera) {
    const { teamManager } = gameContext;
    const clientTeamID = teamManager.getTeamID(this.clientTeam);

    if(this.rules & LOADER_RULE.ALLOW_SPECTATOR) {
        //If no client team is found, assume they're a spectator.
        if(clientTeamID === TeamManager.INVALID_ID) {
            ActorFactory.createSpectator(gameContext, camera);
        }
    }

    teamManager.forEachTeam((team) => {
        const { id } = team;

        if(id === clientTeamID) {
            //Each client SHOULD have a team.
            //If not, the client camera renders with no perspective.
            ActorFactory.createPlayer(gameContext, id, camera);
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
    for(const entity of this.entities) {
        spawnClientEntity(gameContext, entity);
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

ClientMatchLoader.prototype.createEntityFromSnapshot = function(gameContext, data, id) {
    const { type, tileX, tileY, teamID } = data;
    const entity = createClientEntityObject(gameContext, id, teamID, type, tileX, tileY);

    if(entity) {
        entity.load(data);

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            entity.setOpacity(0);
        }

        updateEntitySprite(gameContext, entity);
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
    const cContext = createPlayCamera(gameContext);
    const camera = cContext.getCamera();

    this.rules |= LOADER_RULE.ALLOW_SPECTATOR;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext, camera);

    for(const { id, data } of entities) {
        this.createEntityFromSnapshot(gameContext, data, id);
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
    const cContext = createPlayCamera(gameContext);
    const camera = cContext.getCamera();

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext, camera);

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

        this.createEntityFromSnapshot(gameContext, blob, nextID);
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
    const cContext = createPlayCamera(gameContext);
    const camera = cContext.getCamera();

    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext, camera);
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
            const commanderID = COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE;

            team.loadCommander(gameContext, commanderID);
        }

        if(faction !== null) {
            const factionID = FACTION_TYPE[faction] ?? FACTION_TYPE.RED;

            team.loadAsFaction(gameContext, factionID);
        }

        if(color !== null) {
            const colorID = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;
            const schemaType = typeRegistry.getSchemaType(colorID);

            team.schema = schemaType;
        }

        //Assume that schema is always not null after this point.
        if(!team.schema) {
            const schemaType = typeRegistry.getSchemaType(SCHEMA_TYPE.RED);

            team.schema = schemaType;
        }

        //Assume that currency is always not null after this point.
        if(!team.currency) {
            team.currency = typeRegistry.getCurrencyType(CURRENCY_TYPE.NONE);
        }

        //The map may have a preset cash for each team.
        team.cash = cash;

        //Most game modes have objectives, except custom PvP.
        if(this.rules & LOADER_RULE.LOAD_OBJECTIVES) {
            for(const objectiveID of objectives) {
                const config = this.objectives[objectiveID];

                if(config) {
                    const objective = ObjectiveFactory.createObjective(config);

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
    const { teamManager } = gameContext;

    teamManager.forEachTeam((team) => {
        const { id } = team;

        ActorFactory.createActor(gameContext, id);
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

    //Override is irrelevant as the server is the authority for ids.
    for(let i = 0; i < this.entities.length; i++) {
        const entityID = entityManager.getNextID();
        
        spawnServerEntity(gameContext, this.entities[i], entityID);
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

    const { width, height, data } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height, sourceID);

    worldMap.decodeLayers(data);
    language.clearMapTranslations();

    if(translations !== null) {
        language.registerMapTranslations(translations);
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

    const { width, height, data } = file;
    const nextID = mapManager.getNextID();
    const worldMap = new BattalionMap(nextID, width, height, sourceID);

    worldMap.decodeLayers(data);
    mapManager.addMap(worldMap);
    mapManager.enableMap(nextID);

    return new ServerMatchLoader(worldMap, file);
}