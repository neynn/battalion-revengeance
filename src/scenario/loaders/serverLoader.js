import { createEntitySnapshotFromEntry } from "../../snapshot/entitySnapshot.js";
import { createServerEntityObject } from "../../systems/spawn.js";
import { ScenarioLoader } from "../scenarioLoader.js";

export const ServerScenarioLoader = function(worldMap, scenario) {
    ScenarioLoader.call(this, worldMap, scenario);
}

ServerScenarioLoader.prototype = Object.create(ScenarioLoader.prototype);
ServerScenarioLoader.prototype.constructor = ServerScenarioLoader;

ServerScenarioLoader.prototype.createActors = function(gameContext) {
    const { teamManager, mapMaster } = gameContext;
    const { slots } = mapMaster;

    teamManager.forEachTeam((team) => {
        const { id } = team;
        let client = null;

        for(const { teamID, clientID } of slots) {
            if(teamID === id) {
                client = clientID;
                break;
            }
        }

        this.createServerActor(gameContext, id, client);
    })
}

ServerScenarioLoader.prototype.createEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world; 

    for(let i = 0; i < this.scenario.entities.length; i++) {
        const entityID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromEntry(gameContext, this.scenario.entities[i]);
        const entity = createServerEntityObject(gameContext, entityID, snapshot);

        if(entity) {
            //...
        }
    }
}

ServerScenarioLoader.prototype.loadMap = function(gameContext, overrides) {
    //TODO(neyn): Split into PvP and COOP.
    //COOP has fixed allies, PvP does not.
    this.rules |= LOADER_RULE.FIXED_ALLIES;
    this.rules |= LOADER_RULE.LOAD_OBJECTIVES;
    this.rules |= LOADER_RULE.CREATE_EVENT_SIMULATION;

    this.createTeams(gameContext, overrides);
    this.createActors(gameContext);
    this.createEntities(gameContext);
    this.applyBuildingSettings();
    this.createMines(gameContext);
    this.createWorldEvents(gameContext);
}