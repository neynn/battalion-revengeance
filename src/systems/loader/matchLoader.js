import { COMMANDER_TYPE, COMPONENT_TYPE, FACTION_TYPE, LOADER_RULE, OBJECTIVE_TYPE, SCHEMA_TYPE, SHOP_TYPE } from "../../enums.js";
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
import { PlayUI } from "../../ui/contexts/playUI.js";
import { createPlayCamera } from "../camera.js";

import { DialogueComponent } from "../../event/components/dialogue.js";
import { ExplodeTileComponent } from "../../event/components/explodeTile.js";
import { SpawnComponent } from "../../event/components/spawn.js";
import { createEntitySnapshotFromJSON } from "../../snapshot/entitySnapshot.js";
import { PlaySoundComponent } from "../../event/components/playSound.js";
import { PlaySpriteComponent } from "../../event/components/playSprite.js";
import { TeamManager } from "../../team/teamManager.js";
import { StoryActor } from "../../actors/storyActor.js";
import { ScenarioModel } from "../../scenarioModel.js";
import { createMineObject } from "../spawn.js";

const createCustomSchema = function(gameContext, team, colorMap) {
    const { typeRegistry } = gameContext;
    const { id } = team;
    const colorID = SCHEMA_TYPE.CUSTOM_1 + id; //TeamID from 0 to n (max 8).
    const schema = typeRegistry.getSchemaType(colorID);

    schema.reset();
    schema.loadCustom(colorMap);

    team.color = colorID;
}

/**
 * 
 * @param {BattalionMap} worldMap 
 * @param {ScenarioModel} scenario 
 */
export const MatchLoader = function(worldMap, scenario) {
    this.rules = LOADER_RULE.NONE;
    this.worldMap = worldMap;
    this.scenario = scenario;

    this.buildingSettings = scenario.buildingSettings;
    this.teams = scenario.teams;
    this.mines = scenario.mines;
    this.entities = scenario.entities;

    this.objectives = scenario.objectives;
    this.events = scenario.events;
}

MatchLoader.prototype.createMines = function(gameContext) {
    const { teamManager, typeRegistry } = gameContext;

    for(const mine of this.mines) {
        const { x, y, team, type, isVisible } = mine;
        const { category } = typeRegistry.getMineType(type);

        if(this.worldMap.isMinePlaceable(gameContext, x, y, category)) {
            const teamID = teamManager.getTeamID(team);
            const mineObject = createMineObject(gameContext, teamID, type, x, y);

            if(isVisible) {
                mineObject.show();
            }
            
            this.worldMap.addMine(mineObject);
        }
    }
}

MatchLoader.prototype.applyBuildingSettings = function(gameContext) {
    const { teamManager } = gameContext;

    for(const settings of this.buildingSettings) {
        const { x, y, team, shop, customID } = settings;
        const building = this.worldMap.getBuilding(x, y);

        if(building) {
            const teamID = teamManager.getTeamID(team);

            if(teamID !== TeamManager.INVALID_ID) {
                const team = teamManager.getTeam(teamID);

                building.setTeam(teamID);
                building.setColor(team.color);
            }

            building.customID = customID;
            building.shop = shop;
        }
    }
}

MatchLoader.prototype.createEventComponents = function(gameContext, event, simulation, effects) {
    if(this.rules & LOADER_RULE.CREATE_EVENT_SIMULATION) {
        for(const sim of simulation) {
            switch(sim.type) {
                case COMPONENT_TYPE.EXPLODE_TILE: {
                    const { layer, x, y } = sim;
                    const component = new ExplodeTileComponent(layer, x, y);

                    event.addSimulation(component);
                    break;
                }
                case COMPONENT_TYPE.SPAWN_ENTITY: {
                    const { entity } = sim;
                    const snapshot = createEntitySnapshotFromJSON(gameContext, this.worldMap, entity);
                    const component = new SpawnComponent(snapshot);

                    event.addSimulation(component);
                    break;
                }
            }
        }
    }

    if(this.rules & LOADER_RULE.CREATE_EVENT_EFFECTS) {
        for(const effect of effects) {
            switch(effect.type) {
                case COMPONENT_TYPE.PLAY_SOUND: {
                    const { sound } = effect;
                    const component = new PlaySoundComponent(sound);

                    event.addEffect(component);
                    break;
                }
                case COMPONENT_TYPE.PLAY_SPRITE: {
                    const { sprite, x, y } = effect;
                    const component = new PlaySpriteComponent(sprite, x, y);

                    event.addEffect(component);
                    break;
                }
                case COMPONENT_TYPE.DIALOGUE: {
                    const { dialogue } = effect;

                    for(const entry of dialogue) {
                        entry.narrator = COMMANDER_TYPE[entry.narrator] ?? COMMANDER_TYPE.NONE;
                    }

                    const component = new DialogueComponent(dialogue);

                    event.addEffect(component);
                    break;
                }
            }
        }
    }
}

MatchLoader.prototype.createWorldEvents = function(gameContext) {
    const { world } = gameContext;
    const { eventHandler } = world;

    for(let i = 0; i < this.scenario.events.length; i++) {
        const { id, turn, round, next, simulation, effects } = this.scenario.events[i];
        const event = eventHandler.createEvent(id);

        this.createEventComponents(gameContext, event, simulation, effects);

        event.setTriggerTime(turn, round);
        event.setNext(next);
    }
}

MatchLoader.prototype.createServerActor = function(gameContext, teamID, clientID) {
    const { world } = gameContext;
    const { actorManager } = world;
    const actorID = actorManager.getNextID();
    const actor = new ServerActor(actorID);

    actorManager.addActor(actor);
    actor.setTeam(teamID);
    actor.clientID = clientID;
}

MatchLoader.prototype.createActor = function(gameContext, teamID) {
    const { world } = gameContext;
    const { actorManager } = world;
    const actorID = actorManager.getNextID();
    const actor = new StoryActor(actorID);

    actorManager.addActor(actor);
    actor.setTeam(teamID);
}

MatchLoader.prototype.createPlayer = function(gameContext, teamID) {
    const { world } = gameContext;
    const { actorManager } = world;
    const context = createPlayCamera(gameContext);
    const actorID = actorManager.getNextID();
    const playUI = new PlayUI(context);
    const actor = new Player(actorID, playUI.inspector, context.renderer);

    playUI.load(gameContext);
    actorManager.addActor(actor);
    actor.setTeam(teamID);
    actor.loadKeybinds(gameContext);
    actor.states.setNextState(gameContext, Player.STATE.IDLE);
}

MatchLoader.prototype.createSpectator = function(gameContext) {
    const { world } = gameContext;
    const { actorManager } = world;
    const context = createPlayCamera(gameContext);
    const actorID = actorManager.getNextID();
    const playUI = new PlayUI(context);
    const actor = new Spectator(actorID, playUI.inspector, context.renderer);

    playUI.load(gameContext);
    actorManager.addActor(actor);
    actor.loadKeybinds(gameContext);
}

MatchLoader.prototype.createObjective = function(config) {
    switch(config.type) {
        case OBJECTIVE_TYPE.DEFEAT: {
            const objective = new DefeatObjective();
            const targetID = this.scenario.getCustomID(config.target);

            if(targetID !== ScenarioModel.INVALID_CUSTOM_ID) {
                objective.targetID = targetID;
            }

            return objective;
        }
        case OBJECTIVE_TYPE.PROTECT: {
            const objective = new ProtectObjective();

            for(const targetName of config.targets) {
                const targetID = this.scenario.getCustomID(targetName);

                if(targetID !== ScenarioModel.INVALID_CUSTOM_ID) {
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
        const { id, cash, commander, faction, objectives } = this.teams[i];
        const team = teamManager.createTeam(id);

        team.cash = cash;
        team.commander = commander;
        team.loadAsFaction(gameContext, faction);

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
            const { allies } = this.teams[i];

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