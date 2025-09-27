import { getRandomChance } from "../../engine/math/math.js";
import { Team } from "./team.js";

/**
 * Server-Side initialization code for the VersusMode.
 */

/**
 * Turns are skipable,
 * Actions are always 3 per turn
 * If EVENT_SKIP_TURN is sent to the server, the server will check if the player is acting, therefore => "actor" is the current acting player in versus mode
 * player go ping-pong
 * 
 */

//when a unit dies it gets detracted from the teams unit count. if a random unit gets summoned via any event e, it gets added to the unit count of the team
//that emitted event e.

//they will be used for MODE_STRIKE and MODE_STORY. -> Energy system feeds directly into turn manager
//if energy = 0 then no more turn for player x. <- meaning: player/ai based energy meter.

export const VersusMode = function() {
    this.config = {};
    this.teams = new Map();
    this.players = [];
    this.currentTeam = -1; //index on the current actor in the acting order. if a player dies, the order has to change
    this.actingOrder = []; //sets the order in which the teams act. each team has its own acting order. //holds the IDS of the teams - not the teams itself like in team.js
}

VersusMode.prototype.setConfig = function(config) {
    this.config = config;
}

VersusMode.prototype.toNextTeam = function() {
    this.currentTeam++;
    this.currentTeam %= this.actingOrder.length;

    const actorID = this.actingOrder[this.currentTeam];
    const team = this.teams.get(actorID);

    return team;
}

VersusMode.prototype.addPlayer = function(actorID) {
    this.players.push({
        "id": actorID,
        "actionsLeft": 0,
        "maxActions": 0
    });
}

VersusMode.prototype.initTeams = function(pickedMap) {
    if(!pickedMap) {
        return;
    }

    const { teamSetup } = pickedMap;

    for(const teamID in teamSetup) {
        const { maxPlayers } = teamSetup;
        const team = new Team(teamID, maxPlayers);

        this.teams.set(teamID, team);
    }
}

VersusMode.prototype.getEventSpawns = function(pickedMap) {
    if(!pickedMap) {
        return;
    }

    const spawns = [];
    const { randomEvents } = pickedMap;

    for(let i = 0; i < randomEvents.length; i++) {
        const randomEvent = randomEvents[i];
        const { type, team, tileX, tileY, chance } = randomEvent;
        const random = getRandomChance();

        if(chance < random) {
            continue;
        }

        spawns.push({
            "type": type,
            "team": team,
            "tileX": tileX,
            "tileY": tileY
        });
    }

    return spawns;
}

//before the map gets grabbed, the amount of player has to be decided
// -> add all players and put them in their teams beforehand. for now no team switching.
VersusMode.prototype.pickRandomMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const pickableMaps = [];

    for(let i = 0; i < this.config.availableMaps.length; i++) {
        const mapID = this.config.availableMaps[i];
        const mapType = mapManager.getMapType(mapID);

        if(!mapType || mapType.totalPlayers < this.players.length) {
            continue;
        }

        pickableMaps.push(mapType);
    }

    if(pickableMaps.length === 0) {
        return null;
    }

    const pickedMapIndex = Math.floor(Math.random() * pickableMaps.length);
    const pickedMap = pickableMaps[pickedMapIndex];

    return pickedMap;
}