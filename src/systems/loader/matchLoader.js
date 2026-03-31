import { COMMANDER_TYPE, COMPONENT_TYPE, FACTION_TYPE, LOADER_RULE, OBJECTIVE_TYPE, SCHEMA_TYPE } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

import { CaptureObjective } from "../../team/objective/types/capture.js";
import { DefeatObjective } from "../../team/objective/types/defeat.js";
import { DefendObjective } from "../../team/objective/types/defend.js";
import { ErrorObjective } from "../../team/objective/types/error.js";
import { ProtectObjective } from "../../team/objective/types/protect.js";
import { SurviveObjective } from "../../team/objective/types/survive.js";
import { TimeLimitObjective } from "../../team/objective/types/timeLimit.js";

import { BattalionActor } from "../../actors/battalionActor.js";
import { Player } from "../../actors/player.js";
import { ServerActor } from "../../actors/serverActor.js";
import { Spectator } from "../../actors/spectator.js";
import { PlayUI } from "../../ui/playUI.js";
import { createPlayCamera } from "../camera.js";

import { DialogueComponent } from "../../event/components/dialogue.js";
import { ExplodeTileComponent } from "../../event/components/explodeTile.js";
import { PlayEffectComponent } from "../../event/components/playEffect.js";
import { SpawnComponent } from "../../event/components/spawn.js";
import { WorldEvent } from "../../../engine/world/event/worldEvent.js";

const createCustomSchema = function(gameContext, team, colorMap) {
    const { typeRegistry } = gameContext;
    const { id } = team;
    const colorID = SCHEMA_TYPE.CUSTOM_1 + id; //TeamID from 0 to n (max 8).
    const schema = typeRegistry.getSchemaType(colorID);

    schema.reset();
    schema.loadCustom(colorMap);

    team.color = colorID;
}

export const MatchLoader = function(worldMap, mapFile) {
    this.rules = LOADER_RULE.NONE;
    this.worldMap = worldMap;

    this.teams = mapFile.teams ?? [];
    this.entities = mapFile.entities ?? [];
    this.objectives = mapFile.objectives ?? {};
    this.events = mapFile.events ?? {};
    this.buildings = mapFile.buildings ?? [];
    this.mines = mapFile.mines ?? [];
}

MatchLoader.prototype.createComponents = function(components, allowedComponents) {
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

MatchLoader.prototype.createWorldEvents = function(gameContext, allowedComponents) {
    const { world } = gameContext;
    const { eventHandler } = world;

    for(const eventName in this.events) {
        const { turn, round, next = null, components = [] } = this.events[eventName];
        const componentObjects = this.createComponents(components, allowedComponents);
        const event = new WorldEvent(eventName, componentObjects);

        event.setTriggerTime(turn, round);
        event.setNext(next);
        eventHandler.addEvent(event);
    }
}

MatchLoader.prototype.createServerActor = function(gameContext, teamID, clientID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actorID = turnManager.getNextID();
    const actor = new ServerActor(actorID);

    turnManager.addActor(actor);
    actor.setTeam(teamID);
    actor.setName("Server");
    actor.clientID = clientID;
}

MatchLoader.prototype.createActor = function(gameContext, teamID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actorID = turnManager.getNextID();
    const actor = new BattalionActor(actorID);

    turnManager.addActor(actor);
    actor.setTeam(teamID);
    actor.setName("NPC");
}

MatchLoader.prototype.createPlayer = function(gameContext, teamID) {
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
}

MatchLoader.prototype.createSpectator = function(gameContext) {
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

MatchLoader.prototype.createObjective = function(config) {
    switch(config.type) {
        case OBJECTIVE_TYPE.DEFEAT: {
            const objective = new DefeatObjective();
            const targetID = this.worldMap.getCustomID(config.target);

            if(targetID !== BattalionMap.INVALID_CUSTOM_ID) {
                objective.targetID = targetID;
            }

            return objective;
        }
        case OBJECTIVE_TYPE.PROTECT: {
            const objective = new ProtectObjective();

            for(const targetName of config.targets) {
                const targetID = this.worldMap.getCustomID(targetName);

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

MatchLoader.prototype.createTeams = function(gameContext, overrides) {
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
                    const objective = this.createObjective(config);

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

            if(this.rules & LOADER_RULE.CUSTOM_COLOR) {
                if(color !== null) {
                    createCustomSchema(gameContext, teamObject, color);
                }
            }

            //In dynamic PvP games, the allies are set by the overrides.
            if(!(this.rules & LOADER_RULE.FIXED_ALLIES)) {
                teamManager.loadAllies(teamID, allies);
            }
        }
    }
}