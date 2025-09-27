import { MapHelper } from "../../engine/map/mapHelper.js";
import { ActorSpawner } from "../actors/actorSpawner.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { EntitySpawner } from "../entity/entitySpawner.js";
import { BattalionMap } from "./battalionMap.js";

const PLAYER_NAME = "PLAYER";

export const MapSpawner = {
    //TODO: Add other actor types and other tags. Also add is essential.
    initMap: function(gameContext, mapData) {
        const { world } = gameContext;
        const { turnManager } = world;
        const { teams = {}, actors = {}, entities = {} } = mapData;
        const actorOrder = [];
        const actorMap = {};

        let playerCreated = false;

        for(const teamName in teams) {
            ActorSpawner.createTeam(gameContext, teamName, teams[teamName]);
        }

        for(const actorName in actors) {            
            if(!playerCreated && actorName === PLAYER_NAME) {
                const config = actors[actorName];
                const actor = ActorSpawner.createPlayer(gameContext, config);

                if(actor) {
                    const actorID = actor.getID();

                    actorMap[actorName] = actorID;
                    actorOrder.push(actorID);

                    playerCreated = true;
                }
            }
        }

        for(const entityName in entities) {
            const config = entities[entityName];
            const { x = -1, y = -1, owner = null, type = null } = config;
            const ownerID = actorMap[owner];

            if(ownerID !== undefined) {
                const spawnConfig = EntitySpawner.createEntityConfig(type, x, y, BattalionEntity.DIRECTION.EAST);
                const entity = EntitySpawner.spawnEntity(gameContext, spawnConfig, ownerID);

                console.log("ENTITY_CREATED", entity);
            }
        }

        turnManager.setActorOrder(gameContext, actorOrder);
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