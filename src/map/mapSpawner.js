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
            entities = [],
            objectives = {},
            events = {},
            buildings = [],
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

            if(!team) {
                continue;
            }

            let actor = null;
            const commanderType = teams[teamName].commander;
            const teamAllies = teams[teamName].allies ?? [];

            for(const teamID of teamAllies) {
                const allyTeam = teamManager.getTeam(teamID);

                if(allyTeam) {
                    team.addAlly(teamID);
                    allyTeam.addAlly(teamName);
                }
            }

            if(!playerCreated && commanderType === PLAYER_NAME) {
                actor = ActorSpawner.createPlayer(gameContext, commanderType, teamName);
                playerCreated = true;
            } else {
                actor = ActorSpawner.createAI(gameContext, commanderType, teamName);
            }

            if(actor) {
                team.setActor(actor.getID());
            }
        }

        for(let i = 0; i < entities.length; i++) {
            EntitySpawner.loadEntity(gameContext, entities[i]);
        }

        for(let i = 0; i < buildings.length; i++) {
            EntitySpawner.loadBuilding(gameContext, worldMap, buildings[i]);
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
        //ActionHelper.createRegularDialogue(gameContext, DialogueHandler.TYPE.PRELOGUE);
    },
    createStoryMap: async function(gameContext, sourceID) {
        const { world, language } = gameContext;
        const { mapManager } = world;
        const currentLanguage = language.getCurrent();
        const mapSource = mapManager.getMapSource(sourceID);
        const [file, translations] = await Promise.all([mapSource.promiseFile(), mapSource.promiseTranslations(currentLanguage.getID())]);

        if(file !== null) {
            const { width, height, data } = file;
            const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

            if(worldMap) {
                const mapID = worldMap.getID();
                
                worldMap.setSource(mapSource);
                worldMap.decodeLayers(data);

                if(translations !== null) {
                    currentLanguage.registerMap(mapID, translations);
                    currentLanguage.selectMap(mapID);
                    worldMap.onLanguageUpdate(currentLanguage, translations);
                }

                mapManager.enableMap(mapID);
                MapSpawner.initMap(gameContext, worldMap, file);

                return worldMap;
            }
        }

        return null;
    },
    createEditorMap: async function(gameContext, sourceID) {
        const { world } = gameContext;
        const { mapManager } = world;
        const mapSource = mapManager.getMapSource(sourceID);
        const file = await mapSource.promiseFile();

        if(file !== null) {
            const { width, height, data } = file;
            const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

            if(worldMap) {
                const mapID = worldMap.getID();

                worldMap.setSource(mapSource);
                worldMap.decodeLayers(data);
                mapManager.enableMap(mapID);
                
                return worldMap;
            }
        }

        return null;
    },
    createCustomMap: function(gameContext, mapData) {
        const { world } = gameContext;
        const { mapManager } = world;
        const { width, height, data } = mapData;
        const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));

        if(worldMap) {
            const mapID = worldMap.getID();

            worldMap.decodeLayers(data);
            mapManager.enableMap(mapID);
            MapSpawner.initMap(gameContext, worldMap, mapData);
        }
    },
    createEmptyMap: function(gameContext, width, height) {     
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.createMap(id => new BattalionMap(id, width, height));
        
        if(worldMap) {
            const mapID = worldMap.getID();
    
            mapManager.enableMap(mapID);
        }

        return worldMap;
    }
}