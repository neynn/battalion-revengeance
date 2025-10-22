export const FlagHelper = {
    hasFlag: function(flags, flag) {
        return (flags & flag) !== 0;
    },
    setFlag: function(flags, flag) {
        return flags | flag;
    },
    removeFlag: function(flags, flag) {
        return flags & (~flag);
    }
}