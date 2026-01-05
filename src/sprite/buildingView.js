import { SchemaView } from "./schemaView.js";

export const BuildingView = function(visual, spriteID, schemaID, schema) {
    SchemaView.call(this, visual, spriteID, schemaID, schema);
}

BuildingView.prototype = Object.create(SchemaView.prototype);
BuildingView.prototype.constructor = BuildingView;