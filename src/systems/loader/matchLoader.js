import { COMMANDER_TYPE, COMPONENT_TYPE, FACTION_TYPE, LOADER_RULE, OBJECTIVE_TYPE, COLOR_TYPE, SHOP_TYPE } from "../../enums.js";
import { BattalionMap } from "../../map/battalionMap.js";

import { CaptureObjective } from "../../team/objective/types/capture.js";
import { DefeatObjective } from "../../team/objective/types/defeat.js";
import { DefendObjective } from "../../team/objective/types/defend.js";
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
import { createEntitySnapshotFromEntry } from "../../snapshot/entitySnapshot.js";
import { PlaySoundComponent } from "../../event/components/playSound.js";
import { PlaySpriteComponent } from "../../event/components/playSprite.js";
import { TeamManager } from "../../team/teamManager.js";
import { StoryActor } from "../../actors/storyActor.js";
import { ScenarioModel } from "../../scenarioModel.js";
import { createMineObject } from "../spawn.js";

const createCustomColor = function(gameContext, team, colorMap) {
    const { typeRegistry } = gameContext;
    const { id } = team;
    const colorID = COLOR_TYPE.CUSTOM_1 + id; //TeamID from 0 to n (max 8).
    const colorType = typeRegistry.getColorType(colorID);

    colorType.reset();
    colorType.loadCustom(colorMap);

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

    this.entities = scenario.entities;
}

MatchLoader.prototype.localizeTiles = function() {
    for(let i = 0; i < this.scenario.localization.length; i++) {
        const { tileX, tileY, name, desc } = this.scenario.localization[i];

        this.worldMap.localizeTile(tileX, tileY, name, desc);
    }
}

MatchLoader.prototype.createMines = function(gameContext) {
    const { teamManager, typeRegistry } = gameContext;

    for(const mine of this.scenario.mines) {
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

    for(const settings of this.scenario.buildingSettings) {
        const { x, y, team, shop, customID, customName, customDesc } = settings;
        const building = this.worldMap.getBuilding(x, y);

        if(building) {
            building.teamID = teamManager.getTeamID(team);
            building.customID = customID;
            building.customName = customName;
            building.customDesc = customDesc;
            building.shop = shop;
        }
    }
}

MatchLoader.prototype.createEventComponents = function(gameContext, event, simulation, effects) {
    if(this.rules & LOADER_RULE.CREATE_EVENT_SIMULATION) {
        for(const { type, data } of simulation) {
            switch(type) {
                case COMPONENT_TYPE.EXPLODE_TILE: {
                    const component = new ExplodeTileComponent(data);

                    event.addSimulation(component);
                    break;
                }
                case COMPONENT_TYPE.SPAWN_ENTITY: {
                    const snapshot = createEntitySnapshotFromEntry(gameContext, data.entity);
                    const component = new SpawnComponent(snapshot);

                    event.addSimulation(component);
                    break;
                }
            }
        }
    }

    if(this.rules & LOADER_RULE.CREATE_EVENT_EFFECTS) {
        for(const { type, data } of effects) {
            switch(type) {
                case COMPONENT_TYPE.PLAY_SOUND: {
                    const component = new PlaySoundComponent(data);

                    event.addEffect(component);
                    break;
                }
                case COMPONENT_TYPE.PLAY_SPRITE: {
                    const component = new PlaySpriteComponent(data);

                    event.addEffect(component);
                    break;
                }
                case COMPONENT_TYPE.DIALOGUE: {
                    const component = new DialogueComponent(data);

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
        const { turn, round, next, simulation, effects } = this.scenario.events[i];
        const event = eventHandler.createEvent();

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

MatchLoader.prototype.createObjective = function(type, data) {
    switch(type) {
        case OBJECTIVE_TYPE.DEFEAT: return new DefeatObjective(data);
        case OBJECTIVE_TYPE.PROTECT: return new ProtectObjective(data);
        case OBJECTIVE_TYPE.CAPTURE: return new CaptureObjective(data);
        case OBJECTIVE_TYPE.DEFEND: return new DefendObjective(data);
        case OBJECTIVE_TYPE.SURVIVE: return new SurviveObjective(data);
        case OBJECTIVE_TYPE.TIME_LIMIT: return new TimeLimitObjective(data);
        default: return null;
    }
}

MatchLoader.prototype.createTeams = function(gameContext, overrides) {
    const { teamManager } = gameContext;

    for(let i = 0; i < this.scenario.teams.length; i++) {
        const { id, cash, commander, faction, objectives } = this.scenario.teams[i];
        const team = teamManager.reserveTeam(i, id);

        if(!team) {
            continue;
        }

        team.cash = cash;
        team.commander = commander;
        team.loadAsFaction(gameContext, faction);

        //Most game modes have objectives, except custom PvP.
        if(this.rules & LOADER_RULE.LOAD_OBJECTIVES) {
            for(const objectiveID of objectives) {
                const config = this.scenario.objectives[objectiveID];

                if(config) {
                    const { type, data } = config;
                    const objective = this.createObjective(type, data);

                    if(objective) {
                        team.addObjective(objective);
                    }
                }
            }
        }
    }

    //When allies are fixed, the map determines them.
    if(this.rules & LOADER_RULE.FIXED_ALLIES) {
        for(let i = 0; i < this.scenario.alliances.length; i++) {
            teamManager.loadAlliance(this.scenario.alliances[i]);
        }
    }

    for(const override of overrides) {
        const { team, color, name, allies } = override;
        const teamID = teamManager.getTeamID(team);
        const teamObject = teamManager.getTeam(teamID);

        if(teamObject) {
            teamObject.customName = name;

            if(this.rules & LOADER_RULE.CUSTOM_COLOR) {
                if(color !== null) {
                    createCustomColor(gameContext, teamObject, color);
                }
            }

            //In dynamic PvP games, the allies are set by the overrides.
            if(!(this.rules & LOADER_RULE.FIXED_ALLIES)) {
                //TODO(neyn): Implement this!
            }
        }
    }
}