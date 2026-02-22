import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { createClientBuildingObject, createClientEntityObject } from "./spawn.js";

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

const loadEntities = function(gameContext, entities) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const blob of entities) {
        const { type, tileX, tileY, teamID } = blob;
        const entityID = entityManager.getNextID();
        const entity = createClientEntityObject(gameContext, entityID, teamID, type, tileX, tileY);

        if(entity) {
            entity.load(blob);

            if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                entity.setOpacity(0);
            }

            entity.updateSprite(gameContext);
        }
    }
}

const loadBuildings = function(gameContext, buildings) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    for(const blob of buildings) {
        const { type, tileX, tileY, teamID } = blob;
        const building = createClientBuildingObject(gameContext, teamID, type, tileX, tileY);

        if(building) {
            building.load(blob);
            worldMap.addBuilding(building);
        }
    }
}

const loadMines = function(gameContext, mines) {
    
}

export const saveStoryMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const file = new PrettyJSON(4);

    const entities = saveEntities(gameContext);
    const teams = saveTeams(gameContext);
    const buildings = saveBuildings(worldMap);
    const mines = saveMines(worldMap);
    const edits = saveEdits(worldMap);

    file.open();
    file.writeLine("mapID", worldMap.sourceID);
    file.writeLine("edits", edits, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("entities", entities, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("teams", teams, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("mines", mines, PrettyJSON.LIST_TYPE.ARRAY);
    file.writeList("buildings", buildings, PrettyJSON.LIST_TYPE.ARRAY);
    file.close();
    file.download("map");
}

export const loadStoryMap = function(gameContext, data) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.loadEdits(data.edits);

    loadBuildings(gameContext, data.buildings)
    loadEntities(gameContext, data.entities);
}