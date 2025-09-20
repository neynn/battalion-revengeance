import { Player } from "./player.js";

export const ActorSpawner = {
    createPlayer: function(gameContext, config) {
        const { world } = gameContext;
        const { turnManager } = world;
        const { type, id } = config;
        const player = turnManager.createActor((actorID, actorType) => {
            return new Player(actorID, actorType);
        }, type, id);

        player.loadKeybinds(gameContext);

        return player;
    }
};