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
            buildings = {},
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
                ActorSpawner.createPlayer(gameContext, config, actorName);
                playerCreated = true;
            } else {
                ActorSpawner.createAI(gameContext, config, actorName);
            }
        }

        for(const entityName in entities) {
            EntitySpawner.loadEntity(gameContext, entities[entityName], entityName);
        }

        for(const objectiveName in objectives) {
            console.log(objectives[objectiveName]);
        }

        for(const buildingName in buildings) {
            EntitySpawner.loadBuilding(gameContext, worldMap, buildings[buildingName], buildingName);
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
        //ActionHelper.createRegularDialogue(gameContext, DialogueHandler.TYPE.PRELOGUE);
    },
    createStoryMap: async function(gameContext, typeID) {
        let loadedData = null;

        return MapHelper.loadRegisteredMap(gameContext, typeID, (id, data) => {
            loadedData = data;

            return new BattalionMap(id);
        }).then(map => {
            if(loadedData) {
                MapSpawner.initMap(gameContext, map, loadedData);
            }

            return map;
        });
    },
    createEditorMap: function(gameContext, typeID) {
        return MapHelper.loadRegisteredMap(gameContext, typeID, (id, mapData) => new BattalionMap(id));
    },
    createEmptyMap: function(gameContext, mapData) {
        return MapHelper.loadCustomMap(gameContext, mapData, (id) => new BattalionMap(id));
    }
}