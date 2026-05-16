import { WorldMap } from "../engine/map/worldMap.js";
import { WorldEvent } from "../engine/world/event/worldEvent.js";
import { COMMANDER_TYPE, COMPONENT_TYPE, FACTION_TYPE, MINE_TYPE, SHOP_TYPE } from "./enums.js";

const createDialogueEntry = function() {
    return {
        "narrator": COMMANDER_TYPE.NONE,
        "text": null,
        "voice": null
    }
}

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

    this.customEntityIDs = new Map();
    this.customEntityCount = 0;
}

ScenarioModel.INVALID_CUSTOM_ID = -1;

ScenarioModel.prototype.getCustomID = function(name) {
    const customID = this.customEntityIDs.get(name);
    
    if(customID === undefined) {
        return ScenarioModel.INVALID_CUSTOM_ID;
    }

    return customID;
}

ScenarioModel.prototype.getAndSetCustomID = function(name) {
    let customID = ScenarioModel.INVALID_CUSTOM_ID;
    
    if(name !== null) {
        if(this.customEntityIDs.has(name)) {
            customID = this.customEntityIDs.get(name);
        } else {
            customID = this.customEntityCount++;

            this.customEntityIDs.set(name, customID);
        }
    }

    return customID;
}

ScenarioModel.prototype.getAndSetCustomEventID = function(name) {
    let customID = ScenarioModel.INVALID_CUSTOM_ID;
    
    if(name !== null) {
        if(this.eventIDs.has(name)) {
            customID = this.eventIDs.get(name);
        } else {
            customID = this.customEntityCount++;

            this.eventIDs.set(name, customID);
        }
    }

    return customID;
}

ScenarioModel.prototype.load = function(data) {
    const {
        map = null,
        client = null,
        teams = [],
        entities = [],
        mines = [],
        buildingSettings = [],
        prelogue = [],
        postlogue = [],
        defeat = [],
        events = [],
        objectives = {}
    } = data;

    const resolvedEvents = new Map();
    const resolvedTeams = new Set();

    this.mapID = map;
    this.client = client;
    
    if(data.music) {
        this.music = data.music;
    }

    if(data.playlist) {
        this.playlist = data.playlist;
    }

    for(let i = 0; i < teams.length; i++) {
        const {
            id = null,
            cash = 0,
            commander = null,
            faction = null,
            allies = [],
            objectives = []
        } = teams[i];

        if(id === null || resolvedTeams.has(id)) {
            continue;
        }

        this.teams.push({
            "id": id,
            "cash": cash,
            "commander": COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE,
            "faction": FACTION_TYPE[faction] ?? FACTION_TYPE.RED,
            "allies": allies,
            "objectives": objectives
        });

        resolvedTeams.add(id);
    }

    for(let i = 0; i < buildingSettings.length; i++) {
        const {
            id = null,
            x = -1,
            y = -1,
            team = null,
            shop = null
        } = buildingSettings[i];

        this.buildingSettings.push({
            "x": x,
            "y": y,
            "customID": this.getAndSetCustomID(id),
            "team": team,
            "shop": SHOP_TYPE[shop] ?? SHOP_TYPE.NONE
        });
    }

    for(let i = 0; i < mines.length; i++) {
        const {
            x = -1,
            y = -1,
            team = null,
            type = null,
            visible = false
        } = mines[i];

        this.mines.push({
            "x": x,
            "y": y,
            "team": team,
            "type": MINE_TYPE[type] ?? MINE_TYPE.LAND,
            "isVisible": visible
        });
    }

    for(let i = 0; i < prelogue.length; i++) {
        const {
            narrator = null,
            text = null,
            voice = null
        } = prelogue[i];

        const entry = createDialogueEntry();

        entry.narrator = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
        entry.text = text;
        entry.voice = voice;

        this.prelogue.push(entry);
    }

    for(let i = 0; i < postlogue.length; i++) {
        const {
            narrator = null,
            text = null,
            voice = null
        } = postlogue[i];

        const entry = createDialogueEntry();

        entry.narrator = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
        entry.text = text;
        entry.voice = voice;

        this.postlogue.push(entry);
    }

    for(let i = 0; i < defeat.length; i++) {
        const {
            narrator = null,
            text = null,
            voice = null
        } = defeat[i];

        const entry = createDialogueEntry();

        entry.narrator = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
        entry.text = text;
        entry.voice = voice;

        this.defeat.push(entry);
    }

    for(let i = 0; i < entities.length; i++) {
        const { 
            id = null
        } = entities[i];

        //TODO(neyn): Later.
        entities[i].id = this.getAndSetCustomID(id);

        this.entities.push(entities[i]);
    }

    for(let i = 0; i < events.length; i++) {
        const {
            id = null,
            next = null,
            turn = WorldEvent.INVALID_TIME,
            round = WorldEvent.INVALID_TIME,
            simulation = [],
            effects = []
        } = events[i];

        const resolvedSimulation = [];
        const resolvedEffects = [];
        const eventID = this.events.length;

        if(id !== null && !resolvedEvents.has(id)) {
            resolvedEvents.set(id, eventID);
        }

        for(const sim of simulation) {
            const type = COMPONENT_TYPE[sim.type] ?? COMPONENT_TYPE.NONE;
            let data = null;

            switch(type) {
                case COMPONENT_TYPE.EXPLODE_TILE: {
                    data = {
                        "layerID": WorldMap.INVALID_LAYER_ID,
                        "tileX": WorldMap.OUT_OF_BOUNDS,
                        "tileY": WorldMap.OUT_OF_BOUNDS
                    };

                    data.layerID = sim.layer ?? WorldMap.INVALID_LAYER_ID;
                    data.tileX = sim.x ?? WorldMap.OUT_OF_BOUNDS;
                    data.tileY = sim.y ?? WorldMap.OUT_OF_BOUNDS;
                    break;
                }
                case COMPONENT_TYPE.SPAWN_ENTITY: {
                    data = {
                        "entity": null
                    };

                    data.entity = sim.entity;
                    break;
                }
            }

            if(data !== null) {
                resolvedSimulation.push({
                    "type": type,
                    "data": data
                });
            }
        }

        for(const eff of effects) {
            const type = COMPONENT_TYPE[eff.type] ?? COMPONENT_TYPE.NONE;
            let data = null;

            switch(type) {
                case COMPONENT_TYPE.DIALOGUE: {
                    data = {
                        "dialogue": []
                    };

                    for(const entry of eff.dialogue) {
                        const { narrator, text, voice } = entry;
                        const dialogueEntry = createDialogueEntry();

                        dialogueEntry.narrator = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
                        dialogueEntry.text = text;
                        dialogueEntry.voice = voice;

                        data.dialogue.push(dialogueEntry);
                    }

                    break;
                }
                case COMPONENT_TYPE.PLAY_SOUND: {
                    data = {
                        "sound": null
                    };

                    data.sound = eff.sound;
                    break;
                }
                case COMPONENT_TYPE.PLAY_SPRITE: {
                    data = {
                        "sprite": null,
                        "tileX": WorldMap.OUT_OF_BOUNDS,
                        "tileY": WorldMap.OUT_OF_BOUNDS
                    };

                    data.sprite = eff.sprite;
                    data.tileX = eff.x;
                    data.tileY = eff.y;
                    break;
                }
            }

            if(data !== null) {
                resolvedEffects.push({
                    "type": type,
                    "data": data
                });
            }
        }

        this.events.push({
            "id": eventID,
            "turn": turn,
            "round": round,
            "next": WorldEvent.INVALID_ID,
            "simulation": resolvedSimulation,
            "effects": resolvedEffects
        });
    }

    for(let i = 0; i < events.length; i++) {
        const eventID = resolvedEvents.get(events[i].next);

        if(eventID !== undefined) {
            this.events[i].next = eventID;
        }
    }

    this.objectives = objectives;
}