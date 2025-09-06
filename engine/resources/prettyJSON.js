export const PrettyJSON = function(spacing) {
    this.depth = 0;
    this.spacing = spacing;
    this.jsonString = "";
    this.writes = 0;
    this.openLists = [];
}

PrettyJSON.LIST_TYPE = {
    OBJECT: 0,
    ARRAY: 1
};

PrettyJSON.prototype.pad = function(depth) {
    const whitespace = depth * this.spacing;

    for(let i = 0; i < whitespace; i++) {
        this.jsonString += " ";
    }
}

PrettyJSON.prototype.newLine = function(depth) {
    if(this.openLists.length === 0) {
        if(this.writes > 0) {
            this.jsonString += ",\n";
        }
    } else {
        const list = this.openLists[this.openLists.length - 1];
        const { writes } = list;

        if(writes > 0) {
            this.jsonString += ",\n";
        }
    }

    this.pad(depth);
}

PrettyJSON.prototype.newEmptyLine = function(depth) {
    this.jsonString += "\n";
    this.pad(depth);
}

PrettyJSON.prototype.getJoinString = function(depth) {
    let join = ",\n";
    const whitespace = depth * this.spacing;

    for(let i = 0; i < whitespace; i++) {
        join += " ";
    }

    return join;
}

PrettyJSON.prototype.open = function(depth = 0, name) {
    this.pad(depth);
    this.depth = depth + 1;

    if(name) {
        this.jsonString += `"${name}": {\n`;
    } else {
        this.jsonString += "{\n";
    }

    return this;
}

PrettyJSON.prototype.close = function() {
    while(this.openLists.length !== 0) {
        this.closeList();
    }

    this.depth--;
    this.newEmptyLine(this.depth);
    this.jsonString += "}";

    return this;
}

PrettyJSON.prototype.openList = function(id, type = PrettyJSON.LIST_TYPE.OBJECT) {
    this.newLine(this.depth);

    switch(type) {
        case PrettyJSON.LIST_TYPE.OBJECT: {
            this.jsonString += `"${id}": {\n`;
            break;
        }
        case PrettyJSON.LIST_TYPE.ARRAY: {
            this.jsonString += `"${id}": [\n`;
            break;
        }
    }

    this.depth++;

    this.openLists.push({
        "type": type,
        "writes": 0
    });

    return this;
}

PrettyJSON.prototype.closeList = function() {
    if(this.openLists.length === 0) {
        return this;
    }

    const list = this.openLists.pop();
    const { type } = list;

    this.depth--;
    this.newEmptyLine(this.depth);

    switch(type) {
        case PrettyJSON.LIST_TYPE.OBJECT: {
            this.jsonString += "}";
            break;
        }
        case PrettyJSON.LIST_TYPE.ARRAY: {
            this.jsonString += "]";
            break;
        }
    }

    if(this.openLists.length === 0) {
        this.writes++;
    } else {
        const list = this.openLists[this.openLists.length - 1];
        list.writes++;
    }

    return this;
}

PrettyJSON.prototype.writeLine = function(id, data) {
    this.newLine(this.depth);
    this.jsonString += `"${id}": ${JSON.stringify(data)}`;

    if(this.openLists.length === 0) {
        this.writes++;
    } else {
        const list = this.openLists[this.openLists.length - 1];
        list.writes++;
    }

    return this;
}

PrettyJSON.prototype.writeList = function(id, jsonStrings, type) {
    this.openList(id, type);
    this.pad(this.depth);

    const joinString = this.getJoinString(this.depth);
    const joined = jsonStrings.join(joinString);

    this.jsonString += joined;
    this.closeList();

    return this;
}

PrettyJSON.prototype.build = function() {
    return this.jsonString;
}

PrettyJSON.prototype.reset = function() {
    this.depth = 0;
    this.openLists = [];
    this.jsonString = "";
    this.writes = 0;

    return this;
}

PrettyJSON.prototype.download = function(filename) {
    const blob = new Blob([this.jsonString], { type: "text/json" });
    const link = document.createElement("a");
  
    link.download = `${filename}.json`;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");
  
    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
  
    link.dispatchEvent(evt);
    link.remove();
}