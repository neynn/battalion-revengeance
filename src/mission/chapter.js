export const Chapter = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.missions = [];
}

Chapter.prototype.hasMission = function(missionID) {
    for(const { id } of this.missions) {
        if(id === missionID) {
            return true;
        }
    }

    return false;
}