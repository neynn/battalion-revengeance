import { BattalionActor } from "../actors/battalionActor.js";
import { Player } from "../actors/player.js";
import { CaptureObjective } from "../team/objective/types/capture.js";
import { DefeatObjective } from "../team/objective/types/defeat.js";
import { DefendObjective } from "../team/objective/types/defend.js";
import { ProtectObjective } from "../team/objective/types/protect.js";
import { SurviveObjective } from "../team/objective/types/survive.js";
import { TimeLimitObjective } from "../team/objective/types/timeLimit.js";
import { OBJECTIVE_TYPE } from "../enums.js";
import { Spectator } from "../actors/spectator.js";
import { ErrorObjective } from "../team/objective/types/error.js";

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

    for(const objectiveID of objectives) {
        const config = allObjectives[objectiveID];

        if(config) {
            const objective = ObjectiveFactory.createObjective(config);

            team.addObjective(objective);
        }
    }
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

export const createPlayer = function(gameContext, commanderType, teamName, clientCamera) {
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
}

export const createSpectator = function(gameContext, clientCamera) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actorID = turnManager.getNextID();
    const actor = new Spectator(actorID, clientCamera);

    turnManager.addActor(actor);
    actor.loadKeybinds(gameContext);
    actor.setName("SPECTATOR");
}