import { BrushSet } from "../../../../engine/map/editor/brushSet.js";
import { Scroller } from "../../../../engine/util/scroller.js";
import { ENTITY_TYPE } from "../../../enums.js";
import { EditorTool } from "./tool.js";

export const EntityTool = function() {
    EditorTool.call(this);

    this.entitySets = new Scroller(new BrushSet("INVALID", ENTITY_TYPE._INVALID));
}

EntityTool.prototype = Object.create(EditorTool);
EntityTool.prototype.constructor = EntityTool;