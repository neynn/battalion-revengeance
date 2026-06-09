export const ScenarioModel = function(id) {
    this.id = id;
    this.mapID = null;
    this.client = null;
    this.music = "rivers_of_steel";
    this.playlist = null;
    this.teams = [];
    this.entities = [];
    this.mines = [];
    this.buildingSettings = [];
    this.objectives = {};
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.events = [];
    this.localization = [];
    this.alliances = [];
    this.text = [];
    this.maxPlayers = 0;
    this.minPlayers = 0;
}

ScenarioModel.INVALID_CUSTOM_ID = -1;