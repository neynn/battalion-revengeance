import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { WorldEvent } from "../../engine/world/event/worldEvent.js";
import { MAX_TEAMS } from "../constants.js";
import { COMMANDER_TYPE, COMPONENT_TYPE, DIRECTION, ENTITY_TYPE, FACTION_TYPE, MINE_TYPE, OBJECTIVE_TYPE, SHOP_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";
import { EntityEntry } from "./entityEntry.js";
import { ScenarioModel } from "./scenarioModel.js";

export const ScenarioModelParser = function() {
    this.nextID = 0;
    this.idCache = new Map();
    this.textCache = new Map();
    this.teamCache = new Map();
}

ScenarioModelParser.prototype.getCustomID = function(name) {
    const customID = this.idCache.get(name);
    
    if(customID === undefined) {
        return ScenarioModel.INVALID_CUSTOM_ID;
    }

    return customID;
}

ScenarioModelParser.prototype.getTeamID = function(name) {
    let teamID = TeamManager.INVALID_ID;

    if(name !== null) {
        if(this.teamCache.has(name)) {
            teamID = this.teamCache.get(name);
        }
    }

    return teamID;
}

ScenarioModelParser.prototype.getTextID = function(name) {
    let textID = LanguageHandler.INVALID_ID;

    if(name !== null) {
        if(this.textCache.has(name)) {
            textID = this.textCache.get(name);
        }
    }

    return textID;
}

ScenarioModelParser.prototype.getAndSetCustomID = function(name) {
    let customID = ScenarioModel.INVALID_CUSTOM_ID;
    
    if(name !== null) {
        if(this.idCache.has(name)) {
            customID = this.idCache.get(name);
        } else {
            customID = this.nextID++;
            
            this.idCache.set(name, customID);
        }
    }
    
    return customID;
}

ScenarioModelParser.prototype.reset = function() {
    this.nextID = 0;
    this.teamCache.clear();
    this.textCache.clear();
    this.idCache.clear();
}

ScenarioModelParser.prototype.createDialogueEntry = function(config) {
    const {
        narrator = null,
        text = null,
        voice = null
    } = config;

    return {
        "narrator": COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE,
        "text": this.getTextID(text),
        "voice": voice
    }
}

ScenarioModelParser.prototype.createEntityEntry = function(config) {
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
        cash = 0,
        shop = null
    } = config;

    return {
        "id": this.getAndSetCustomID(id),
        "name": this.getTextID(name),
        "desc": this.getTextID(desc),
        "team": this.getTeamID(team),
        "type": ENTITY_TYPE[type] ?? ENTITY_TYPE._INVALID,
        "x": x,
        "y": y,
        "direction": DIRECTION[direction] ?? DIRECTION.EAST,
        "health": health,
        "stealth": stealth,
        "cash": cash,
        "cargo": ENTITY_TYPE[cargo] ?? ENTITY_TYPE._INVALID,
        "shop": SHOP_TYPE[shop] ?? SHOP_TYPE.NONE
    }
}

/**
 * 
 * @param {ScenarioModel} model 
 * @param {*} json 
 */
ScenarioModelParser.prototype.parseModelFromJSON = function(model, json) {
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
        localization = [],
        alliances = [],
        objectives = {},
        text = [],
        maxPlayers = 0
    } = json;

    const resolvedEvents = new Map();

    model.mapID = map;
    model.maxPlayers = maxPlayers;

    for(let i = 0; i < text.length; i++) {
        const { id, translations } = text[i];

        if(!this.textCache.has(id)) {
            model.text.push(translations);
            this.textCache.set(id, i);
        }
    }
    
    if(json.music) {
        model.music = json.music;
    }

    if(json.playlist) {
        model.playlist = json.playlist;
    }

    for(let i = 0; i < teams.length && model.teams.length < MAX_TEAMS; i++) {
        const {
            id = null,
            cash = 0,
            commander = null,
            faction = null,
            objectives = []
        } = teams[i];

        if(id === null || this.teamCache.has(id)) {
            console.error(`Team ${id} does not exist or was mentioned twice!`);
            continue;
        }

        const teamID = model.teams.length;

        this.teamCache.set(id, teamID);
    
        model.teams.push({
            "id": teamID,
            "cash": cash,
            "commander": COMMANDER_TYPE[commander] ?? COMMANDER_TYPE.NONE,
            "faction": FACTION_TYPE[faction] ?? FACTION_TYPE.RED,
            "objectives": objectives
        });
    }

    model.client = this.getTeamID(client);

    const alliedTeams = new Uint8Array(MAX_TEAMS);

    for(let i = 0; i < alliances.length; i++) {
        const alliance = alliances[i];
        const mAlliance = [];

        for(let j = 0; j < alliance.length; j++) {
            const teamName = alliance[j];
            const teamID = this.getTeamID(teamName);

            if(teamID !== TeamManager.INVALID_ID && alliedTeams[teamID] !== 1) {
                mAlliance.push(teamID);
                alliedTeams[teamID] = 1;
            }
        }

        if(mAlliance.length > 1) {
            model.alliances.push(mAlliance);
        }
    }

    for(let i = 0; i < buildingSettings.length; i++) {
        const {
            id = null,
            name = null,
            desc = null,
            x = -1,
            y = -1,
            team = null,
            shop = null
        } = buildingSettings[i];

        model.buildingSettings.push({
            "x": x,
            "y": y,
            "shop": SHOP_TYPE[shop] ?? SHOP_TYPE.NONE,
            "team": this.getTeamID(team),
            "customID": this.getAndSetCustomID(id),
            "customName": this.getTextID(name),
            "customDesc": this.getTextID(desc)
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

        model.mines.push({
            "x": x,
            "y": y,
            "team": this.getTeamID(team),
            "type": MINE_TYPE[type] ?? MINE_TYPE.LAND,
            "isVisible": visible
        });
    }

    for(let i = 0; i < prelogue.length; i++) {
        const entry = this.createDialogueEntry(prelogue[i]);

        model.prelogue.push(entry);
    }

    for(let i = 0; i < postlogue.length; i++) {
        const entry = this.createDialogueEntry(postlogue[i]);

        model.postlogue.push(entry);
    }

    for(let i = 0; i < defeat.length; i++) {
        const entry = this.createDialogueEntry(defeat[i]);

        model.defeat.push(entry);
    }

    for(let i = 0; i < entities.length; i++) {
        const entry = this.createEntityEntry(entities[i]);

        model.entities.push(entry);
    }

    for(let i = 0; i < localization.length; i++) {
        const { x = -1, y = -1, name = null, desc = null } = localization[i];
        const nameID = this.getTextID(name);
        const descID = this.getTextID(desc);

        model.localization.push({
            "tileX": x,
            "tileY": y,
            "name": nameID,
            "desc": descID
        });
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
                        "tileX": WorldMap.OUT_OF_BOUNDS,
                        "tileY": WorldMap.OUT_OF_BOUNDS
                    };

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

        model.events.push({
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
            model.objectives[name] = {
                "type": type,
                "data": data
            }
        }
    }
}