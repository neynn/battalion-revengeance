import { ScenarioModelParser } from "./modelParser.js";
import { ScenarioModel } from "./scenarioModel.js";

export const ScenarioRegistry = function() {
    this.scenarios = new Map();
    this.parser = new ScenarioModelParser();
}

ScenarioRegistry.prototype.load = function(gameContext, scenarios) {
    for(const scenarioID in scenarios) {
        const model = new ScenarioModel(scenarioID);
        const data = scenarios[scenarioID];

        this.scenarios.set(scenarioID, model);
        this.parser.parseModelFromJSON(gameContext, model, data);
        this.parser.reset();
    }
}

ScenarioRegistry.prototype.getScenario = function(scenarioID) {
    const scenario = this.scenarios.get(scenarioID);

    if(!scenario) {
        return null;
    }

    return scenario;
}