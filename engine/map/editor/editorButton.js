export const EditorButton = function(layerID, textID) {
    this.layerID = layerID;
    this.textID = textID;
    this.description = "VISIBLE";
    this.opacity = 1;
    this.state = EditorButton.STATE.VISIBLE;
}

EditorButton.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    EDIT: 2
};

EditorButton.prototype.setState = function(state) {
    switch(state) {
        case EditorButton.STATE.HIDDEN: {
            this.description = "HIDDEN";
            this.opacity = 0;
            this.state = EditorButton.STATE.HIDDEN;
            break;
        }
        case EditorButton.STATE.VISIBLE: {
            this.description = "VISIBLE";
            this.opacity = 1;
            this.state = EditorButton.STATE.VISIBLE;
            break;
        }
        case EditorButton.STATE.EDIT: {
            this.description = "EDIT";
            this.opacity = 1;
            this.state = EditorButton.STATE.EDIT;
            break;
        }
    }

    return this.state;
}

EditorButton.prototype.scrollState = function() {
    switch(this.state) {
        case EditorButton.STATE.HIDDEN: {
            this.setState(EditorButton.STATE.VISIBLE);
            break;
        }
        case EditorButton.STATE.VISIBLE: {
            this.setState(EditorButton.STATE.EDIT);
            break;
        }
        case EditorButton.STATE.EDIT: {
            this.setState(EditorButton.STATE.HIDDEN);
            break;
        }
    }

    return this.state;
}