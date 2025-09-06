import { PlayCamera } from "../../../camera/playCamera.js";
import { DefaultTypes } from "../../../defaultTypes.js";
import { PlaceSystem } from "../../../systems/place.js";
import { SpawnSystem } from "../../../systems/spawn.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const PlayerPlaceState = function() {
    this.buildSpriteIndex = -1;
    this.entityType = null;
    this.transaction = null;
}

PlayerPlaceState.prototype = Object.create(PlayerState.prototype);
PlayerPlaceState.prototype.constructor = PlayerPlaceState;

PlayerPlaceState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const { entityType, transaction } = transition;
    const { tileManager } = gameContext;
    
    const player = stateMachine.getContext();
    const placeLayer = player.camera.getLayer(PlayCamera.LAYER.PLACE);
    const tileID = tileManager.getTileIDByArray(player.config.overlays.enable);

    player.hideRange(gameContext);
    player.hideAttackers(gameContext);
    placeLayer.fill(tileID);

    this.entityType = entityType;
    this.transaction = transaction;

    this.setupBuildSprite(gameContext, player);
    this.highlightPlaceableTiles(gameContext, player);
}

PlayerPlaceState.prototype.onExit = function(gameContext, stateMachine) {
    const { spriteManager } = gameContext;

    const player = stateMachine.getContext();
    const { hover, camera } = player;
    const placeLayer = camera.getLayer(PlayCamera.LAYER.PLACE);

    spriteManager.destroySprite(this.buildSpriteIndex);
    hover.hideSprite(gameContext);
    placeLayer.clear();

    this.buildSpriteIndex = -1;
    this.entityType = null;
    this.transaction = null;
}

PlayerPlaceState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.hover.alignSpriteOnTile(gameContext);
}

PlayerPlaceState.prototype.onClick = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    const player = stateMachine.getContext();
    const { inventory, hover, teamID } = player;
    const { tileX, tileY } = hover;

    const isPlaceable = PlaceSystem.isEntityPlaceable(gameContext, tileX, tileY, this.entityType.dimX, this.entityType.dimY, teamID);

    if(!isPlaceable) {
        soundPlayer.play(player.config.sounds.error);
        return;
    }

    const spawnConfig = DefaultTypes.createSpawnConfig(this.entityType.id, teamID, player.getID(), tileX, tileY);
    const entity = SpawnSystem.createEntity(gameContext, spawnConfig);

    if(entity) {
        soundPlayer.play(player.config.sounds.place);
        inventory.removeByTransaction(this.transaction);
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}

PlayerPlaceState.prototype.setupBuildSprite = function(gameContext, player) {
    const { spriteManager } = gameContext;
    const { hover } = player;
    const buildID = this.entityType.sprites.idle;

    hover.updateSprite(gameContext, buildID);

    const spriteID = player.getSpriteType(Player.SPRITE_TYPE.PLACE, `${this.entityType.dimX}-${this.entityType.dimY}`);
    const buildSprite = spriteManager.createSprite(spriteID);

    if(buildSprite) {
        const playerSprite = spriteManager.getSprite(hover.spriteIndex);

        playerSprite.addChild(buildSprite);

        this.buildSpriteIndex = buildSprite.getIndex();
    }
}

PlayerPlaceState.prototype.highlightPlaceableTiles = function(gameContext, player) {
    const { tileManager } = gameContext;
    const blockedTileID = tileManager.getTileIDByArray(player.config.overlays.disabled);
    const blockedIndices = PlaceSystem.getBlockedPlaceIndices(gameContext, player.teamID);
    const placeLayer = player.camera.getLayer(PlayCamera.LAYER.PLACE);

    for(let i = 0; i < blockedIndices.length; i += 2) {
        const index = blockedIndices[i];
        const state = blockedIndices[i + 1];

        switch(state) {
            case PlaceSystem.BLOCK_REASON.ENTITY_ATTACK: {
                placeLayer.setItem(blockedTileID, index);
                break;
            }
            default: {
                placeLayer.clearItem(index);
                break;
            }
        }
    }
}