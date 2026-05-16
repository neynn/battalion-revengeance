import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { fillTurnSnapshot } from "../snapshot/turnSnapshot.js";
import { loadClientScenario } from "./map.js";

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

export const saveStoryMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager, eventHandler } = world;
    const worldMap = mapManager.getActiveMap();
    const file = new PrettyJSON(4);

    const entities = saveEntities(gameContext);
    const teams = saveTeams(gameContext);
    const buildings = saveBuildings(worldMap);
    const mines = saveMines(worldMap);
    const data = worldMap.saveLayers();
    const events = eventHandler.saveTriggeredEvents();

    file.open();
    file.writeLine("scenario", worldMap.scenario);
    file.writeLine("turn", fillTurnSnapshot(gameContext));
    file.writeLine("events", events);
    file.writeList("data", data);
    file.writeList("entities", entities, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("teams", teams, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("mines", mines, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("buildings", buildings, PrettyJSON.LIST_TYPE.ARRAY);
    file.close();
    file.download("map");
}

export const loadSavedScenario = function(gameContext, data, overrides) {
    const { actionRouter } = gameContext;
    const { scenario } = data;
    
    return loadClientScenario(gameContext, scenario)
    .then(loader => loader.createSavedMatch(gameContext, data, overrides));
}