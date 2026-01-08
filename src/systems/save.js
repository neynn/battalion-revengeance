import { EntityManager } from "../../engine/entity/entityManager.js";
import { PrettyJSON } from "../../engine/resources/prettyJSON.js";
import { placeEntityOnMap } from "./map.js";
import { createClientEntityFromConfig, createSpawnConfig } from "./spawn.js";

export const saveStoryMap = function(gameContext) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const file = new PrettyJSON(4);
    const entities = [];

    entityManager.forEachEntity((entity) => {
        const entry = entity.save();
        const json = JSON.stringify(entry);

        entities.push(json);
    });

    file.open();
    file.writeLine("edits", worldMap.edits);
    file.writeList("entities", entities, PrettyJSON.LIST_TYPE.ARRAY)
    file.close();
    file.download("map");
}

export const loadStoryMap = function(gameContext, data) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.loadEdits(data.edits);

    for(const blob of data.entities) {
        const { type, tileX, tileY, teamID } = blob;
        const config = createSpawnConfig(EntityManager.ID.INVALID, type, tileX, tileY);
        const entity = createClientEntityFromConfig(gameContext, config, teamID);

        if(entity) {
            entity.load(gameContext, blob);
            placeEntityOnMap(gameContext, entity);
        }
    }
}