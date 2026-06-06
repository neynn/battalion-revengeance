import { TRAIT_TYPE } from "../enums.js";

export const CaptureSystem = {
    canEntityCaptureAt: function(gameContext, entity, tileX, tileY) {
        if(!entity.hasTrait(TRAIT_TYPE.CONQUEROR)) {
            return false;
        }
    
        const { world, teamManager } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
    
        if(!worldMap) {
            return false;
        }
    
        const building = worldMap.getBuilding(tileX, tileY);
    
        if(!building || !building.hasTrait(TRAIT_TYPE.CAPTURABLE)) {
            return false;
        }

        return !teamManager.isAlly(entity.teamID, building.teamID);
    }
};