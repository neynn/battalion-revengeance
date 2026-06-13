export const ResouceSystem = {
    getCostFactor: function(gameContext, teamID, categoryID) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        let costReduction = 0;

        for(const building of worldMap.buildings) {
            if(building.teamID === teamID) {
                costReduction += building.getCostReduction(gameContext, categoryID);

                if(costReduction >= 100) {
                    costReduction = 100;
                    break;
                }
            }
        }

        return 1 - (costReduction / 100);
    }
};