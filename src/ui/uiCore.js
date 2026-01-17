import { ArenaLobby } from "./elements/arenaLobby.js";

export const UICore = function() {
    this.arena = new ArenaLobby();
}

UICore.prototype.init = function(gameContext) {
    this.arena.init(gameContext);
}

UICore.prototype.exit = function(gameContext) {
    this.arena.exit(gameContext);
}