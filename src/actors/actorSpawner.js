import { Player } from "./player.js";

export const ActorSpawner = {
    createPlayer: function(gameContext, config) {
        const { world } = gameContext;
        const { turnManager } = world;
        const { type, id, color, customColor } = config;
        const player = turnManager.createActor((actorID, actorType) => {
            const actor = new Player(actorID, actorType);

            if(!customColor) {
                actor.setColor(color);
            } else {
                actor.setCustomColor(customColor);
            }

            return actor;
        }, type, id);

        player.loadKeybinds(gameContext);

        return player;
    }
};