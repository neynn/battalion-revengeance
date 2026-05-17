import { ScenarioModel } from "./scenarioModel.js";

export const ScenarioRegistry = function() {
    this.scenarios = new Map();
}

ScenarioRegistry.prototype.load = function(gameContext, scenarios) {
    for(const scenarioID in scenarios) {
        const model = new ScenarioModel(scenarioID);
        const data = scenarios[scenarioID];

        model.load(data);

        this.scenarios.set(scenarioID, model);
    }
}

ScenarioRegistry.prototype.getScenario = function(scenarioID) {
    const scenario = this.scenarios.get(scenarioID);

    if(!scenario) {
        return null;
    }

    return scenario;
}
