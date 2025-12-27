import { BattalionActor } from "../actors/battalionActor.js";
import { Player } from "../actors/player.js";
import { BattalionMap } from "../map/battalionMap.js";
import { JammerField } from "../map/jammerField.js";
import { CaptureObjective } from "../team/objective/types/capture.js";
import { DefeatObjective } from "../team/objective/types/defeat.js";
import { DefendObjective } from "../team/objective/types/defend.js";
import { ProtectObjective } from "../team/objective/types/protect.js";
import { SurviveObjective } from "../team/objective/types/survive.js";
import { TimeLimitObjective } from "../team/objective/types/timeLimit.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { createPlayCamera } from "./camera.js";
import { spawnBuildingFromJSON, spawnEntityFromJSON } from "./spawn.js";

const PLAYER_NAME = "PLAYER";

const createAI = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.createActor((actorID) => {
        const actorObject = new BattalionActor(actorID);

        actorObject.setTeam(teamName);

        return actorObject;
    });

    actor.loadCommander(gameContext, commanderType);
    actor.setName("NPC");

    return actor;
}

const createPlayer = function(gameContext, commanderType, teamName) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.createActor((actorID) => {
        const context = createPlayCamera(gameContext);
        const camera = context.getCamera();
        const actorObject = new Player(actorID, camera);

        actorObject.setTeam(teamName);
        camera.addPerspective(teamName);
        camera.setMainPerspective(teamName);

        return actorObject;
    });

    actor.loadKeybinds(gameContext);
    actor.loadCommander(gameContext, commanderType);
    actor.states.setNextState(gameContext, Player.STATE.IDLE);
    actor.setName("PLAYER");

    return actor;
}

const createTeam = function(gameContext, teamID, config) {
    const { teamManager } = gameContext;
    const { 
        nation,
        faction,
        color,
        customColor
    } = config;
    const team = teamManager.createTeam(teamID);

    if(!team) {
        console.log("Team could not be created!");
        return null;
    }

    if(nation) {
        team.loadAsNation(gameContext, nation);
    }

    if(faction) {
        team.loadAsFaction(gameContext, faction);
    }

    if(customColor) {
        team.setCustomColor(customColor);
    } else if(color) {
        team.setColor(gameContext, color);
    }

    return team;
}

const createObjectives = function(team, objectives, allObjectives) {
    for(const objectiveID of objectives) {
        const config = allObjectives[objectiveID];

        if(!config) {
            continue;
        }

        const { type } = config;

        switch(type) {
            case TypeRegistry.OBJECTIVE_TYPE.DEFEAT: {
                team.addObjective(new DefeatObjective(config.target));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.PROTECT: {
                team.addObjective(new ProtectObjective(config.targets));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.CAPTURE: {
                team.addObjective(new CaptureObjective(config.tiles));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.DEFEND: {
                team.addObjective(new DefendObjective(config.tiles));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.SURVIVE: {
                team.addObjective(new SurviveObjective(config.turn));
                break;
            }
            case TypeRegistry.OBJECTIVE_TYPE.TIME_LIMIT: {
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

const loadMap = function(gameContext, worldMap, mapData) {
    const { client, teamManager, eventHandler, dialogueHandler } = gameContext;
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

    let playerCreated = false;

    for(const teamName in teams) {
        const teamObjectives = teams[teamName].objectives ?? [];
        const team = createTeam(gameContext, teamName, teams[teamName]);

        if(team) {
            createObjectives(team, teamObjectives, objectives);
        }
    }

    for(const teamName in teams) {
        const team = teamManager.getTeam(teamName);

        if(!team) {
            continue;
        }

        let actor = null;
        const commanderType = teams[teamName].commander;
        const teamAllies = teams[teamName].allies ?? [];

        for(const teamID of teamAllies) {
            const allyTeam = teamManager.getTeam(teamID);

            if(allyTeam) {
                team.addAlly(teamID);
                allyTeam.addAlly(teamName);
            }
        }

        if(!playerCreated && commanderType === PLAYER_NAME) {
            actor = createPlayer(gameContext, commanderType, teamName);
            playerCreated = true;
        } else {
            actor = createAI(gameContext, commanderType, teamName);
        }

        if(actor) {
            team.setActor(actor.getID());
        }
    }

    for(let i = 0; i < entities.length; i++) {
        spawnEntityFromJSON(gameContext, entities[i]);
    }

    for(let i = 0; i < buildings.length; i++) {
        spawnBuildingFromJSON(gameContext, worldMap, buildings[i]);
    }

    for(const objectiveName in objectives) {
        console.log(objectives[objectiveName]);
    }

    if(playlist) {
        musicPlayer.playPlaylist(playlist);
    } else {
        musicPlayer.play(music);
    }

    worldMap.loadLocalization(localization);
    dialogueHandler.loadPrelogue(prelogue);
    dialogueHandler.loadPostlogue(postlogue);
    dialogueHandler.loadDefeat(defeat);
    eventHandler.loadEvents(events);
    teamManager.updateStatus(gameContext);
    teamManager.updateOrder(gameContext);
    //ActionHelper.createRegularDialogue(gameContext, DialogueHandler.TYPE.PRELOGUE);
}

export const placeEntityOnMap = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const { tileX, tileY, teamID, config } = entity;
        const { dimX, dimY, jammerRange } = config;
        const entityID = entity.getID();
        const jammerFlags = entity.getJammerFlags();

        worldMap.addEntity(tileX, tileY, dimX, dimY, entityID);
    
        if(jammerFlags !== JammerField.FLAG.NONE) {
            worldMap.fill2DGraph(tileX, tileY, jammerRange, (nextX, nextY) => {
                worldMap.addJammer(nextX, nextY, teamID, jammerFlags);
            });
        }
    }
}

export const removeEntityFromMap = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const { tileX, tileY, teamID, config } = entity;
        const { dimX, dimY, jammerRange } = config;
        const entityID = entity.getID();
        const jammerFlags = entity.getJammerFlags();

        worldMap.removeEntity(tileX, tileY, dimX, dimY, entityID);

        if(jammerFlags !== JammerField.FLAG.NONE) {
            worldMap.fill2DGraph(tileX, tileY, jammerRange, (nextX, nextY) => {
                worldMap.removeJammer(nextX, nextY, teamID, jammerFlags);
            });
        }
    }
}

export const createEmptyMap = function(gameContext, width, height) {     
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));
    
    if(worldMap) {
        const mapID = worldMap.getID();

        mapManager.enableMap(mapID);
    }

    return worldMap;
}

export const createCustomMap = function(gameContext, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { width, height, data } = mapData;
    const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

    if(worldMap) {
        const mapID = worldMap.getID();

        worldMap.decodeLayers(data);
        mapManager.enableMap(mapID);

        loadMap(gameContext, worldMap, mapData);
    }
}

export const createEditorMap = async function(gameContext, sourceID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const mapSource = mapManager.getMapSource(sourceID);
    const file = await mapSource.promiseFile();

    if(file !== null) {
        const { width, height, data } = file;
        const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

        if(worldMap) {
            const mapID = worldMap.getID();

            worldMap.setSource(mapSource);
            worldMap.decodeLayers(data);
            mapManager.enableMap(mapID);
            
            return worldMap;
        }
    }

    return null;
}

export const createStoryMap = async function(gameContext, sourceID) {
    const { world, language } = gameContext;
    const { mapManager } = world;
    const currentLanguage = language.getCurrent();
    const mapSource = mapManager.getMapSource(sourceID);
    const [file, translations] = await Promise.all([mapSource.promiseFile(), mapSource.promiseTranslations(currentLanguage.getID())]);

    if(file !== null) {
        const { width, height, data } = file;
        const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

        if(worldMap) {
            const mapID = worldMap.getID();
            
            worldMap.setSource(mapSource);
            worldMap.decodeLayers(data);

            if(translations !== null) {
                language.registerMapTranslations(translations);
                worldMap.onLanguageUpdate(currentLanguage, translations);
            }

            mapManager.enableMap(mapID);

            loadMap(gameContext, worldMap, file);
        }
    }
}