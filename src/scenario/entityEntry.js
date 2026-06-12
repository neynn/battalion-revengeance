import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, SHOP_TYPE, TRAIT_TYPE } from "../enums.js";
import { createEntitySnapshot } from "../snapshot/entitySnapshot.js";
import { TeamManager } from "../team/teamManager.js";
import { ScenarioModel } from "./scenarioModel.js";

export const EntityEntry = function() {
    this.id = ScenarioModel.INVALID_CUSTOM_ID;
    this.name = LanguageHandler.INVALID_ID;
    this.desc = LanguageHandler.INVALID_ID;
    this.team = TeamManager.INVALID_ID;
    this.x = WorldMap.OUT_OF_BOUNDS;
    this.y = WorldMap.OUT_OF_BOUNDS;
    this.direction = DIRECTION.EAST;
    this.health = 0;
    this.stealth = false;
    this.cash = 0;
    this.type = ENTITY_TYPE._INVALID;
    this.cargo = ENTITY_TYPE._INVALID;
    this.shop = SHOP_TYPE.NONE;
}

EntityEntry.prototype.toSnapshot = function(gameContext) {
    const { typeRegistry } = gameContext;
    const entityType = typeRegistry.getEntityType(type);
    const snapshot = createEntitySnapshot();

    snapshot.id = this.id;
    snapshot.name = this.name;
    snapshot.desc = this.desc;
    snapshot.type = this.type;
    snapshot.health = entityType.health;
    snapshot.teamID = this.team;
    snapshot.tileX = this.x;
    snapshot.tileY = this.y;
    snapshot.direction = this.direction;
    snapshot.cash = this.cash;
    snapshot.transport = this.cargo;
    snapshot.shop = this.shop;

    if(health > 0) {
        snapshot.health = health;
    }

    if(stealth && entityType.hasTrait(TRAIT_TYPE.STEALTH)) {
        snapshot.flags |= BattalionEntity.FLAG.IS_CLOAKED;

        if(entityType.hasTrait(TRAIT_TYPE.SUBMERGED)) {
            snapshot.flags |= BattalionEntity.FLAG.IS_SUBMERGED;
        }
    }

    return snapshot;
}