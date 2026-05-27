import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";

export const CombatSystem = {
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {Mine} mine 
     * @returns 
     */
    isMineTriggered: function(gameContext, entity, mine) {
        const { teamManager } = gameContext;
        const damage = mine.getDamage(entity.config.movementType);

        //Only mines that deal damage blow up.
        if(damage <= 0) {
            return false;
        }

        const traitID = mine.getNullifierTrait();

        //Some traits can dodge mines.
        //These are defined in mine.js
        if(entity.hasTrait(traitID)) {
            return false;
        }

        //Only enemy mines blow up.
        return !teamManager.isAlly(entity.teamID, mine.teamID);
    }
};