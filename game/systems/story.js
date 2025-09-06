import { DefaultTypes } from "../defaultTypes.js";
import { ACTOR_ID, DEBRIS_TYPE, TEAM_NAME } from "../enums.js";
import { ActorSystem } from "./actor.js";
import { MapSystem } from "./map.js";
import { SpawnSystem } from "./spawn.js";
import { DebugSystem } from "./debug.js";

export const StorySystem = function() {}

StorySystem.saveSnapshot = function(gameContext) {
    const { world } = gameContext;
    const { turnManager, entityManager, mapManager } = world;

    const entities = [];
    const actors = [];
    const maps = [];

    turnManager.forAllActors((actor) => actors.push(actor.save()));
    entityManager.forAllEntities((entity) => entities.push(SpawnSystem.getSpawnConfig(gameContext, entity)));
    mapManager.forAllMaps((map) => maps.push(map.save()));

    return {
        "time": Date.now(),
        "actors": actors,
        "entities": entities,
        "maps": maps
    }
}

StorySystem.loadSnapshot = function(gameContext, snapshot) {
    const { time, actors, entities, maps } = snapshot;

    for(let i = 0; i < actors.length; i++) {
        ActorSystem.createActor(gameContext, "ID", actors[i]);
    }

    for(let i = 0; i < entities.length; i++) {
        SpawnSystem.createEntity(gameContext, entities[i]);
    }

    for(let i = 0; i < maps.length; i++) {

    }
}

StorySystem.initialize = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;

    const player = ActorSystem.createStoryPlayer(gameContext, TEAM_NAME.ALLIES);
    const enemy = ActorSystem.createStoryEnemy(gameContext, TEAM_NAME.CRIMSON);

    player.setMaxActions(1);
    enemy.setMaxActions(1);

    turnManager.setActorOrder(gameContext, [ACTOR_ID.STORY_PLAYER, ACTOR_ID.STORY_ENEMY]);

    const entities = [
        DefaultTypes.createSpawnConfig("blue_battery", TEAM_NAME.CRIMSON, ACTOR_ID.STORY_ENEMY, 4, 4),
        DefaultTypes.createSpawnConfig("blue_infantry", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 7, 7),
        DefaultTypes.createSpawnConfig("red_commandobunker", TEAM_NAME.CRIMSON, ACTOR_ID.STORY_ENEMY, 6, 4),
        DefaultTypes.createSpawnConfig("red_guardtower", TEAM_NAME.CRIMSON, ACTOR_ID.STORY_ENEMY, 9, 4),
        DefaultTypes.createSpawnConfig("red_tank", TEAM_NAME.CRIMSON, ACTOR_ID.STORY_ENEMY, 4, 3),
        DefaultTypes.createSpawnConfig("blue_elite_commando", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 4, 5),
        DefaultTypes.createSpawnConfig("blue_commando_ultimate", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 5),
        DefaultTypes.createSpawnConfig("blue_commando", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 3),
        DefaultTypes.createSpawnConfig("red_artillery", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 2, 3),
        DefaultTypes.createSpawnConfig("blue_bootcamp_construction", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 2, 9),
        DefaultTypes.createSpawnConfig("blue_airport", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 4, 9),
        DefaultTypes.createSpawnConfig("blue_landingzone", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 8, 9),
        DefaultTypes.createSpawnConfig("blue_elite_infantry", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 7, 3),
        DefaultTypes.createSpawnConfig("red_battletank", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 3, 5),
        DefaultTypes.createSpawnConfig("blue_elite_battletank", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 3, 4),
        DefaultTypes.createSpawnConfig("blue_guardtower", TEAM_NAME.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 4)
    ];

    MapSystem.createMapByID(gameContext, "oasis").then((worldMap) => {
        console.time();
        worldMap.reload(gameContext);
        worldMap.clearClouds(gameContext, 2, 2, 10, 10);
        worldMap.addDebris(DEBRIS_TYPE.DEBRIS, 2, 2);
        worldMap.addDebris(DEBRIS_TYPE.DEBRIS, 3, 2);
        worldMap.addDebris(DEBRIS_TYPE.DEBRIS, 4, 2);

        for(let i = 0; i < entities.length; i++) {
            SpawnSystem.createEntity(gameContext, entities[i]);
        }

        console.log(StorySystem.saveSnapshot(gameContext));
        //DebugSystem.spawnFullEntities(gameContext);
        //DebugSystem.spawnFullDebris(gameContext);
        console.timeEnd();
    });
}