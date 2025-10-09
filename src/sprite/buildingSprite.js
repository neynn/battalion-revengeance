import { SchemaSprite } from "./schemaSprite.js";

export const BuildingSprite = function() {
    SchemaSprite.call(this);
}

BuildingSprite.prototype = Object.create(SchemaSprite.prototype);
BuildingSprite.prototype.constructor = BuildingSprite;