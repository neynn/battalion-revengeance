export const TileCategory = function() {
    this.members = new Set();
}

TileCategory.prototype.addMember = function(id) {
    this.members.add(id);
}

TileCategory.prototype.hasMember = function(id) {
    return this.members.has(id);
}