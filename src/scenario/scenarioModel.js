import { CLIMATE_TYPE } from "../enums.js";

export const ScenarioModel = function(id) {
    this.id = id;
    this.client = null;
    this.music = "rivers_of_steel";
    this.playlist = null;
    this.climate = CLIMATE_TYPE.TEMPERATE;
    this.teams = [];
    this.entities = [];
    this.mines = [];
    this.buildings = [];
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

    this.mapWidth = 0;
    this.mapHeight = 0;
    this.mapData = [];
}

ScenarioModel.INVALID_CUSTOM_ID = -1;