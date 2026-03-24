import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { LOADER_MODE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";
import { createClientMapLoader } from "./map.js";

const saveEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entities = [];

    entityManager.forEachEntity((entity) => {
        const entry = entity.save();
        const json = JSON.stringify(entry);

        entities.push(json);
    });

    return entities;
}

const saveTeams = function(gameContext) {
    const { teamManager } = gameContext;
    const teams = [];

    teamManager.forEachTeam((team) => {
        const entry = team.save();
        const json = JSON.stringify(entry);

        teams.push(json);
    });

    return teams;
}

const saveBuildings = function(worldMap) {
    const { buildings } = worldMap;
    const data = [];

    for(const building of buildings) {
        const entry = building.save();
        const json = JSON.stringify(entry);

        data.push(json);
    }

    return data;
}

const saveMines = function(worldMap) {
    const { mines } = worldMap;
    const data = [];

    for(const mine of mines) {
        const entry = mine.save();
        const json = JSON.stringify(entry);

        data.push(json);
    }

    return data;
}

const saveEdits = function(worldMap) {
    const { edits } = worldMap;
    const data = [];

    for(const edit of edits) {
        data.push(edit);
    }

    return data;
}

export const getTurnData = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { currentActor, globalTurn, globalRound } = turnManager;
    const turnData = {
        "team": TeamManager.INVALID_ID,
        "rounds": globalRound,
        "turns": globalTurn
    };

    if(currentActor) {
        const team = currentActor.getTeam(gameContext);
        const teamID = team.getID();

        turnData.team = teamID;
    }

    return turnData;
}

export const saveStoryMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager, eventHandler } = world;
    const worldMap = mapManager.getActiveMap();
    const file = new PrettyJSON(4);

    const entities = saveEntities(gameContext);
    const teams = saveTeams(gameContext);
    const buildings = saveBuildings(worldMap);
    const mines = saveMines(worldMap);
    const edits = saveEdits(worldMap);
    const events = eventHandler.saveTriggeredEvents();

    file.open();
    file.writeLine("mapID", worldMap.sourceID);
    file.writeLine("turn", getTurnData(gameContext));
    file.writeLine("events", events);
    file.writeLine("edits", edits, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("entities", entities, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("teams", teams, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("mines", mines, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("buildings", buildings, PrettyJSON.LIST_TYPE.ARRAY);
    file.close();
    file.download("map");
}

export const loadStoryMap = async function(gameContext, data) {
    const matchLoader = await createClientMapLoader(gameContext, data.mapID);

    if(matchLoader) {
        matchLoader.setMode(LOADER_MODE.SP_CUSTOM);
        matchLoader.loadMapFromSnapshot(gameContext, []);
    }
}