export const TraitRegistry = function() {
    this.traits = new Map();
}

TraitRegistry.prototype.registerTrait = function(tagID, tag) {
    if(!this.traits.has(tagID)) {
        this.traits.set(tagID, tag);
    }
}

TraitRegistry.prototype.getTrait = function(tagID) {
    const tag = this.traits.get(tagID);

    if(!tag) {
        return null;
    }

    return tag;
}