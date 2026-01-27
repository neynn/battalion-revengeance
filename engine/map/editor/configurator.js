import { Scroller } from "../../util/scroller.js";
import { BrushSet } from "./brushSet.js";

export const EditorConfigurator = function(mapEditor) {
    this.mapEditor = mapEditor;
    this.brushSizes = new Scroller({ "width": 0, "height": 0 });
    this.brushSets = new Scroller(new BrushSet("INVALID"));
}

EditorConfigurator.prototype.addBrushSet = function(brushSet) {
    this.brushSets.addValue(brushSet);
}

EditorConfigurator.prototype.addBrushSize = function(width, height) {
    this.brushSizes.addValue({
        "width": width,
        "height": height
    });
}

EditorConfigurator.prototype.getSizeInfo = function() {
    const info = this.brushSizes.getInfo();
    const { width, height } = this.brushSizes.getValue();
    const paintWidth = (width + 1) * 2 - 1;
    const paintHeight = (height + 1) * 2 - 1;

    return `SIZE: ${paintWidth}x${paintHeight} (${info})`;
}

EditorConfigurator.prototype.scrollBrushSet = function(delta) {
    this.brushSets.loop(delta);
}

EditorConfigurator.prototype.scrollBrushSize = function(delta) {
    const brushSize = this.brushSizes.scroll(delta);
    const { width, height } = brushSize;

    this.mapEditor.brush.setSize(width, height);
}

EditorConfigurator.prototype.getCurrentSet = function() {
    return this.brushSets.getValue();
}