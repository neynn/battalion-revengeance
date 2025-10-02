import { MapHelper } from "../../engine/map/mapHelper.js";
import { ActorSpawner } from "../actors/actorSpawner.js";
import { EntitySpawner } from "../entity/entitySpawner.js";
import { TeamSpawner } from "../team/teamSpawner.js";
import { BattalionMap } from "./battalionMap.js";

const PLAYER_NAME = "PLAYER";

export const MapSpawner = {
    initMap: function(gameContext, worldMap, mapData) {
        const { client, teamManager, eventHandler, dialogueHandler } = gameContext;
        const { musicPlayer } = client;
        const { 
            music,
            playlist,
            teams = {},
            actors = {},
            entities = {},
            objectives = {},
            events = {},
            localization = [],
            prelogue = [],
            postlogue = [],
            defeat = []
        } = mapData;

        let playerCreated = false;

        for(const teamName in teams) {
            const teamObjectives = teams[teamName].objectives ?? [];
            const team = TeamSpawner.createTeam(gameContext, teamName, teams[teamName]);

            if(team) {
                team.loadObjectives(teamObjectives, objectives);
            }
        }

        for(const teamName in teams) {
            const team = teamManager.getTeam(teamName);

            if(team) {
                const teamAllies = teams[teamName].allies ?? [];

                for(const teamID of teamAllies) {
                    const allyTeam = teamManager.getTeam(teamID);

                    if(allyTeam) {
                        team.addAlly(teamID);
                        allyTeam.addAlly(teamName);
                    }
                }
            }
        }

        for(const actorName in actors) {
            const config = actors[actorName];   

            if(!playerCreated && actorName === PLAYER_NAME) {
                const actor = ActorSpawner.createPlayer(gameContext, config);

                if(actor) {
                    actor.setCustomID(actorName);
                    playerCreated = true;
                }
            } else {
                const actor = ActorSpawner.createActor(gameContext, config);

                if(actor) {
                    actor.setCustomID(actorName);
                }
            }
        }

        for(const entityName in entities) {
            EntitySpawner.loadEntity(gameContext, entities[entityName], entityName);
        }

        for(const objectiveName in objectives) {
            console.log(objectives[objectiveName]);
        }

        if(playlist) {
            musicPlayer.playPlaylist(playlist);
        } else {
            musicPlayer.play(music);
        }

        worldMap.loadLocalization(localization);
        dialogueHandler.loadPrelogue(prelogue);
        dialogueHandler.loadPostlogue(postlogue);
        dialogueHandler.loadDefeat(defeat);
        eventHandler.loadEvents(events);
        teamManager.updateStatus(gameContext);
        teamManager.updateOrder(gameContext);
    },
    createMapByID: function(gameContext, typeID) {
        let loadedData = null;

        return MapHelper.createMapByID(gameContext, typeID, (mapID, mapData) => {
            loadedData = mapData;
            return new BattalionMap(mapID);
        }).then(map => {
            MapSpawner.initMap(gameContext, map, loadedData);
            return map;
        });
    },
    createEmptyMap: function(gameContext, mapData) {
        const worldMap = MapHelper.createEmptyMap(gameContext, mapData, (mapID) => new BattalionMap(mapID));

        if(worldMap) {
            MapSpawner.initMap(gameContext, worldMap, mapData);
        }

        return worldMap;
    }
}