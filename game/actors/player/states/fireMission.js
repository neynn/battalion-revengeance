import { FireMissionAction } from "../../../actions/fireMissionAction.js";
import { PlayCamera } from "../../../camera/playCamera.js";
import { FireMissionSystem } from "../../../systems/fireMission.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const PlayerFireMissionState = function() {
    this.missionID = null;
    this.transaction = null;
}

PlayerFireMissionState.prototype = Object.create(PlayerState.prototype);
PlayerFireMissionState.prototype.constructor = PlayerFireMissionState;

PlayerFireMissionState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const { missionID, transaction } = transition;
    const player = stateMachine.getContext();

    this.missionID = missionID;
    this.transaction = transaction;
    this.showBlockedEntities(gameContext, player);
    this.updateCursor(gameContext, player);

    player.inputQueue.clear();
    player.hideRange(gameContext);
    player.hideAttackers(gameContext);
}

PlayerFireMissionState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.camera.clearOverlay(PlayCamera.OVERLAY.FIRE_MISSION);

    this.missionID = null;
    this.transaction = null;
}

PlayerFireMissionState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;

    hover.alignSpriteOnTile(gameContext);
}

PlayerFireMissionState.prototype.updateCursor = function(gameContext, player) {
    const fireMission = gameContext.getFireMissionType(this.missionID);

    if(fireMission) {
        const { sprites } = fireMission;

        if(sprites) {
            player.hover.updateSprite(gameContext, sprites.cursor);
        }
    }
}

PlayerFireMissionState.prototype.queueFireMission = function(player, tileX, tileY) {
    const playerID = player.getID();
    const request = FireMissionAction.createRequest(playerID, this.missionID, tileX, tileY);
    
    player.inputQueue.enqueueLast(request);
}

PlayerFireMissionState.prototype.onClick = function(gameContext, stateMachine) {
    const fireMission = gameContext.getFireMissionType(this.missionID);

    if(fireMission) {
        const player = stateMachine.getContext();
        const { hover } = player;
        const { tileX, tileY } = hover;
        const isBlocked = FireMissionSystem.isBlocked(gameContext, fireMission, tileX, tileY);

        if(!isBlocked) {
            this.queueFireMission(player, tileX, tileY);
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        } else {
            const { client } = gameContext;
            const { soundPlayer } = client;
            
            soundPlayer.play(player.config.sounds.error, 0.5);
        }
    }
}

PlayerFireMissionState.prototype.showBlockedEntities = function(gameContext, player) {
    const { world, tileManager } = gameContext;
    const { entityManager } = world;
    const { camera } = player;
    const disabledID = tileManager.getTileIDByArray(player.config.overlays.disabled);

    camera.clearOverlay(PlayCamera.OVERLAY.FIRE_MISSION);

    entityManager.forAllEntities((entity) => {
        const isTargetable = FireMissionSystem.isTargetable(entity);

        if(!isTargetable) {
            const endX = entity.tileX + entity.config.dimX;
            const endY = entity.tileY + entity.config.dimY;

            for(let i = entity.tileY; i < endY; i++) {
                for(let j = entity.tileX; j < endX; j++) {
                    camera.pushOverlay(PlayCamera.OVERLAY.FIRE_MISSION, disabledID, j, i);
                }
            }
        }
    });
}