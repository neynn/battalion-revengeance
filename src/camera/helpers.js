const DEFAULT_HEALTH_COLOR = "#ffffff";

const HEALTH_THRESHOLDS = [
    { "above": 0.75, "color": "#00ff00" },
    { "above": 0.5, "color": "#ffff00"},
    { "above": 0.25, "color": "#ff8800"},
    { "above": 0, "color": "#ff0000" }
];

export const getHealthColor = function(vitality) {
    let healthColor = DEFAULT_HEALTH_COLOR;

    for(let i = 0; i < HEALTH_THRESHOLDS.length; i++) {
        const { above, color } = HEALTH_THRESHOLDS[i];

        if(vitality >= above) {
            healthColor = color;
            break;
        }
    }
    
    return healthColor;
}