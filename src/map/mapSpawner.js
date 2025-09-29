import { MapHelper } from "../../engine/map/mapHelper.js";
import { ActorSpawner } from "../actors/actorSpawner.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { EntitySpawner } from "../entity/entitySpawner.js";
import { TeamSpawner } from "../team/teamSpawner.js";
import { BattalionMap } from "./battalionMap.js";

const PLAYER_NAME = "PLAYER";

export const MapSpawner = {
    initMap: function(gameContext, mapData) {
        const { client, teamManager } = gameContext;
        const { musicPlayer } = client;
        const { 
            music,
            playlist,
            teams = {},
            actors = {},
            entities = {},
            objectives = {}
        } = mapData;
        const actorMap = {};

        let playerCreated = false;

        for(const teamName in teams) {
            const teamObjectives = teams[teamName].objectives ?? [];
            const team = TeamSpawner.createTeam(gameContext, teamName, teams[teamName]);

            if(team) {
                team.loadObjectives(teamObjectives, objectives);
            }
        }

        for(const actorName in actors) {
            const config = actors[actorName];   

            if(!playerCreated && actorName === PLAYER_NAME) {
                const actor = ActorSpawner.createPlayer(gameContext, config);

                if(actor) {
                    const actorID = actor.getID();

                    actorMap[actorName] = actorID;

                    playerCreated = true;
                }
            } else {
                const actor = ActorSpawner.createActor(gameContext, config);

                if(actor) {
                    const actorID = actor.getID();

                    actorMap[actorName] = actorID;
                }
            }
        }

        for(const entityName in entities) {
            const config = entities[entityName];
            const { 
                x = -1,
                y = -1,
                owner = null,
                type = null,
                direction = BattalionEntity.DIRECTION_TYPE.EAST
            } = config;
            const ownerID = actorMap[owner];

            if(ownerID !== undefined) {
                const spawnConfig = EntitySpawner.createEntityConfig(type, x, y, direction);
                const entity = EntitySpawner.spawnEntity(gameContext, spawnConfig, ownerID);

                if(entity) {
                    entity.setCustomID(entityName);
                }
            }
        }

        for(const objectiveName in objectives) {
            console.log(objectives[objectiveName]);
        }

        if(playlist) {
            musicPlayer.playPlaylist(playlist);
        } else {
            musicPlayer.play(music);
        }

        teamManager.updateOrder(gameContext);
    },
    createMapByID: function(gameContext, typeID) {
        let loadedData = null;

        return MapHelper.createMapByID(gameContext, typeID, (mapID, mapData) => {
            loadedData = mapData;
            return new BattalionMap(mapID);
        }).then(map => {
            MapSpawner.initMap(gameContext, loadedData);
            return map;
        });
    },
    createEmptyMap: function(gameContext, mapData) {
        const worldMap = MapHelper.createEmptyMap(gameContext, mapData, (mapID) => new BattalionMap(mapID));

        if(worldMap) {
            MapSpawner.initMap(gameContext, mapData);
        }

        return worldMap;
    }
}