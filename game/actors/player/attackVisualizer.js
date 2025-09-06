import { SwapSet } from "../../../engine/util/swapSet.js";
import { PlayCamera } from "../../camera/playCamera.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { AttackSystem } from "../../systems/attack.js";
import { PlayerCursor } from "./playerCursor.js";

export const AttackVisualizer = function() {
    this.attackers = new SwapSet();
    this.isEnabled = true;
    this.isShowable = true;
}

AttackVisualizer.prototype.resetAttackerSprite = function(gameContext, attackerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(attacker) {
        attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

AttackVisualizer.prototype.resetAttackers = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const attackerID of this.attackers.previous) {
        const attacker = entityManager.getEntity(attackerID);

        if(attacker && attacker.isAlive()) {
            attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

AttackVisualizer.prototype.updateCurrentAttackers = function(gameContext, player, camera, attackers, target) {
    const { tileManager } = gameContext;
    const overlayID = tileManager.getTileIDByArray(player.config.overlays.attack);

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const attackerID = attacker.getID();

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);

        camera.pushOverlay(PlayCamera.OVERLAY.ATTACK, overlayID, attacker.tileX, attacker.tileY);

        this.attackers.addCurrent(attackerID);
    }
}

AttackVisualizer.prototype.updateAttackers = function(gameContext, player) {
    const { hover, camera } = player;

    camera.clearOverlay(PlayCamera.OVERLAY.ATTACK);

    if(hover.state !== PlayerCursor.STATE.HOVER_ON_ENTITY) {
        this.resetAttackers(gameContext);
        this.attackers.clear();
        return;
    }

    const mouseEntity = hover.getEntity(gameContext);
    const activeAttackers = AttackSystem.getAttackersForActor(gameContext, mouseEntity, player.getID());

    if(activeAttackers.length === 0) {
        this.resetAttackers(gameContext);
        this.attackers.clear();
        return;
    }

    this.attackers.swap();
    this.updateCurrentAttackers(gameContext, player, camera, activeAttackers, mouseEntity);

    for(const attackerID of this.attackers.previous) {
        if(!this.attackers.isCurrent(attackerID)) {
            this.resetAttackerSprite(gameContext, attackerID);
        }
    }
}

AttackVisualizer.prototype.update = function(gameContext, player) {
    if(this.isEnabled) {
        const { world } = gameContext;
        const { actionQueue } = world;
        
        if(!actionQueue.isRunning() && player.inputQueue.isEmpty()) {
            this.isShowable = true;
            this.updateAttackers(gameContext, player); 
        } else {
            this.isShowable = false;
            player.camera.clearOverlay(PlayCamera.OVERLAY.ATTACK);
        }
    }
}

AttackVisualizer.prototype.enable = function() {
    if(!this.isEnabled) {
        this.isEnabled = true;
    }
}

AttackVisualizer.prototype.disable = function(gameContext, camera) {
    if(this.isEnabled) {
        this.isEnabled = false;
        this.isShowable = false;
        this.resetAttackers(gameContext, camera);
    }
}