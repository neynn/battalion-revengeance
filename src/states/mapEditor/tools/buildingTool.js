import { BUILDING_TYPE, COLOR_TYPE, FACTION_TYPE } from "../../../enums.js";
import { BuildingProxy } from "../../../editor/proxies/buildingProxy.js";

export const BuildingTool = function() {
    this.buildingTypeNames = new Map();
    this.buildingProxies = [];

    for(const name in BUILDING_TYPE) {
        this.buildingTypeNames.set(BUILDING_TYPE[name], name);
    }

    this.currentBuilding = BUILDING_TYPE.COMMAND_CENTER;
    this.currentColor = COLOR_TYPE.BUILDING;
    this.currentFaction = FACTION_TYPE._INVALID;
}

BuildingTool.prototype.createProxiesFromData = function(data) {
    const proxy = new BuildingProxy();

    proxy.fromJSON(data);

    this.buildingProxies.push(proxy);
}

BuildingTool.prototype.saveBuildings = function() {
    const buildings = [];

    for(const proxy of this.buildingProxies) {
        buildings.push(JSON.stringify({
            "x": proxy.tileX,
            "y": proxy.tileY,
            "type": this.buildingTypeNames.get(proxy.typeID)
        }));
    }

    return buildings;
}

BuildingTool.prototype.onUse = function(gameContext, tileX, tileY) {
    for(const proxy of this.buildingProxies) {
        if(proxy.tileX === tileX && proxy.tileY === tileY) {
            return;
        }
    }

    const proxy = new BuildingProxy();

    proxy.tileX = tileX;
    proxy.tileY = tileY;
    proxy.typeID = this.currentBuilding;
    proxy.colorID = this.currentColor;
    proxy.factionID = this.currentFaction;

    this.buildingProxies.push(proxy);
}