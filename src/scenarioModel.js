import { LanguageHandler } from "../engine/language/languageHandler.js";
import { WorldMap } from "../engine/map/worldMap.js";
import { WorldEvent } from "../engine/world/event/worldEvent.js";
import { COMMANDER_TYPE, COMPONENT_TYPE, DIRECTION, ENTITY_TYPE, FACTION_TYPE, MINE_TYPE, OBJECTIVE_TYPE, SHOP_TYPE } from "./enums.js";

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
    this.text = {};
    this.maxPlayers = 0;

    this.customIDs = new Map();
    this.customIDCount = 0;

    this.textMap = new Map();
    this.textID = 0;
}

ScenarioModel.INVALID_CUSTOM_ID = -1;

ScenarioModel.prototype.getCustomID = function(name) {
    const customID = this.customIDs.get(name);
    
    if(customID === undefined) {
        return ScenarioModel.INVALID_CUSTOM_ID;
    }

    return customID;
}

ScenarioModel.prototype.getAndSetCustomID = function(name) {
    let customID = ScenarioModel.INVALID_CUSTOM_ID;
    
    if(name !== null) {
        if(this.customIDs.has(name)) {
            customID = this.customIDs.get(name);
        } else {
            customID = this.customIDCount++;

            this.customIDs.set(name, customID);
        }
    }

    return customID;
}

ScenarioModel.prototype.getOrCreateTextID = function(name) {
    let textID = LanguageHandler.INVALID_ID;

    if(name !== null) {
        if(this.textMap.has(name)) {
            textID = this.textMap.get(name);
        } else {
            textID = this.textID++;

            this.textMap.set(name, textID);
        }
    }

    return textID;
}

ScenarioModel.prototype.createDialogueEntry = function(config) {
    const {
        narrator = null,
        text = null,
        voice = null
    } = config;

    return {
        "narrator": COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE,
        "text": this.getOrCreateTextID(text),
        "voice": voice
    }
}

ScenarioModel.prototype.createEntityEntry = function(config) {
    const {
        id = null,
        name = null,
        desc = null,
        team = null,
        type = null,
        direction = null,
        cargo = null,
        stealth = false,
        health = -1,
        x = -1,
        y = -1,
        cash = 0
    } = config;

    return {
        "id": this.getAndSetCustomID(id),
        "name": this.getOrCreateTextID(name),
        "desc": this.getOrCreateTextID(desc),
        "type": ENTITY_TYPE[type] ?? ENTITY_TYPE._INVALID,
        "x": x,
        "y": y,
        "direction": DIRECTION[direction] ?? DIRECTION.EAST,
        "health": health,
        "stealth": stealth,
        "cash": cash,
        "cargo": ENTITY_TYPE[cargo] ?? ENTITY_TYPE._INVALID,
        "team": team
    }
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
        objectives = {},
        text = {},
        maxPlayers = 0
    } = data;

    const resolvedEvents = new Map();
    const resolvedTeams = new Set();

    this.mapID = map;
    this.client = client;
    this.maxPlayers = maxPlayers;

    //TODO(neyn): Must be loaded separately!
    this.text = text;
    
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
            x = -1,
            y = -1,
            team = null,
            shop = null
        } = buildingSettings[i];

        this.buildingSettings.push({
            "x": x,
            "y": y,
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
        const entry = this.createDialogueEntry(prelogue[i]);

        this.prelogue.push(entry);
    }

    for(let i = 0; i < postlogue.length; i++) {
        const entry = this.createDialogueEntry(postlogue[i]);

        this.postlogue.push(entry);
    }

    for(let i = 0; i < defeat.length; i++) {
        const entry = this.createDialogueEntry(defeat[i]);

        this.defeat.push(entry);
    }

    for(let i = 0; i < entities.length; i++) {
        const entry = this.createEntityEntry(entities[i]);

        this.entities.push(entry);
    }

    for(let i = 0; i < events.length; i++) {
        const eventID = i;
        const eventName = events[i].id;

        if(eventName !== null && !resolvedEvents.has(eventName)) {
            resolvedEvents.set(eventName, eventID);
        }
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
        const nextID = resolvedEvents.get(next) ?? WorldEvent.INVALID_ID;

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
                        "entity": this.createEntityEntry(sim.entity)
                    };

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
                        const dialogueEntry = this.createDialogueEntry(entry);

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
            "turn": turn,
            "round": round,
            "next": nextID,
            "simulation": resolvedSimulation,
            "effects": resolvedEffects
        });
    }

    for(const name in objectives) {
        const config = objectives[name];
        const type = OBJECTIVE_TYPE[config.type] ?? OBJECTIVE_TYPE.NONE;
        let data = null;

        switch(type) {
            case OBJECTIVE_TYPE.DEFEAT: {
                const customID = this.getCustomID(config.target);

                if(customID !== ScenarioModel.INVALID_CUSTOM_ID) {
                    data = {
                        "targetID": customID
                    };
                }

                break;
            }
            case OBJECTIVE_TYPE.PROTECT: {
                data = {
                    "targets": []
                };

                for(const targetName of config.targets) {
                    const customID = this.getCustomID(targetName);

                    if(customID !== ScenarioModel.INVALID_CUSTOM_ID) {
                        data.targets.push(customID);
                    }
                }

                break;
            }
            case OBJECTIVE_TYPE.CAPTURE: {
                data = {
                    "tiles": []
                };

                for(const { x = WorldMap.OUT_OF_BOUNDS, y = WorldMap.OUT_OF_BOUNDS } of config.tiles) {
                    data.tiles.push({
                        "tileX": x,
                        "tileY": y
                    });
                }

                break;
            }
            case OBJECTIVE_TYPE.DEFEND: {
                data = {
                    "tiles": []
                };

                for(const { x = WorldMap.OUT_OF_BOUNDS, y = WorldMap.OUT_OF_BOUNDS } of config.tiles) {
                    data.tiles.push({
                        "tileX": x,
                        "tileY": y
                    });
                } 

                break;
            }
            case OBJECTIVE_TYPE.SURVIVE: {
                data = {
                    "turn": 0
                };

                data.turn = config.turn ?? 0;

                break;
            }
            case OBJECTIVE_TYPE.TIME_LIMIT: {
                data = {
                    "turn": 0
                };

                data.turn = config.turn ?? 0;

                break;
            }
        }

        if(data !== null) {
            this.objectives[name] = {
                "type": type,
                "data": data
            }
        }
    }
}