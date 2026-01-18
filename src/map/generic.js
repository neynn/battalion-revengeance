import { BattalionActor } from "../actors/battalionActor.js";
import { Player } from "../actors/player.js";
import { CaptureObjective } from "../team/objective/types/capture.js";
import { DefeatObjective } from "../team/objective/types/defeat.js";
import { DefendObjective } from "../team/objective/types/defend.js";
import { ProtectObjective } from "../team/objective/types/protect.js";
import { SurviveObjective } from "../team/objective/types/survive.js";
import { TimeLimitObjective } from "../team/objective/types/timeLimit.js";
import { createPlayCamera } from "../systems/camera.js";
import { OBJECTIVE_TYPE } from "../enums.js";
import { Spectator } from "../actors/spectator.js";

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

export const createTeam = function(gameContext, teamID, config, allObjectives) {
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

export const createActor = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actorID = turnManager.getNextID();
    const actor = new BattalionActor(actorID);

    turnManager.addActor(actor);
    actor.setTeam(teamName);
    actor.loadCommander(gameContext, commanderType);
    actor.setName("NPC");
}

export const createPlayer = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const context = createPlayCamera(gameContext);
    const camera = context.getCamera();
    const actorID = turnManager.getNextID();
    const actor = new Player(actorID, camera);

    turnManager.addActor(actor);
    camera.addPerspective(teamName);
    camera.setMainPerspective(teamName);
    actor.setTeam(teamName);
    actor.loadKeybinds(gameContext);
    actor.loadCommander(gameContext, commanderType);
    actor.states.setNextState(gameContext, Player.STATE.IDLE);
    actor.setName("PLAYER");
}

export const createSpectator = function(gameContext) {
    const { world, teamManager } = gameContext;
    const { activeTeams } = teamManager;
    const { turnManager } = world;
    const context = createPlayCamera(gameContext);
    const camera = context.getCamera();
    const actorID = turnManager.getNextID();
    const actor = new Spectator(actorID, camera);

    for(const teamID of activeTeams) {
        camera.addPerspective(teamID);
    }

    turnManager.addActor(actor);
    actor.loadKeybinds(gameContext);
    actor.setName("SPECTATOR");
}