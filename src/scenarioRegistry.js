export const ScenarioRegistry = function() {
    this.scenarios = new Map();
}

ScenarioRegistry.prototype.load = function(scenarios) {
    for(const scenarioID in scenarios) {
        const scenario = scenarios[scenarioID];

        this.scenarios.set(scenarioID, scenario);
    }
}

ScenarioRegistry.prototype.getScenario = function(scenarioID) {
    const scenario = this.scenarios.get(scenarioID);

    if(!scenario) {
        return null;
    }

    return scenario;
}
