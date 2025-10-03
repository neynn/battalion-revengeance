export const TypeCategory = function(name, values) {
    this.name = name;
    this.values = values;
    this.types = {};
}

TypeCategory.prototype.hasType = function(typeID) {
    return this.types[typeID] !== undefined;
}

TypeCategory.prototype.logMissingType = function(typeID) {
    console.log(`Type ${typeID} is not registered in category ${this.name}!`);
}

TypeCategory.prototype.logMissingEnum = function(typeID) {
    console.log(`Enum for ${typeID} is not registered in category ${this.name}!`);
}

TypeCategory.prototype.setTypes = function(types) {
    for(const typeName in types) {
        const typeID = this.values[typeName];

        if(typeID === undefined) {
            this.logMissingEnum(typeName);
        }

        this.types[typeName] = types[typeName];
    }
}

TypeCategory.prototype.getType = function(typeID) {
    const type = this.types[typeID];

    if(!type) {
        this.logMissingType(typeID);

        return null;
    }

    return type;
}