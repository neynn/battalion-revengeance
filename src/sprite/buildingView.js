import { SchemaView } from "./schemaView.js";

export const BuildingView = function(visual, spriteID) {
    SchemaView.call(this, visual, spriteID);
}

BuildingView.prototype = Object.create(SchemaView.prototype);
BuildingView.prototype.constructor = BuildingView;