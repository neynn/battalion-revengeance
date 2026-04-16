export const mRegenerateLines = function(lines, context, text, maxWidth) {
    const words = text.split(' ');
    let line = '';

    for(let i = 0; i < words.length; i++) {
        const testLine = line + (line ? ' ' : '') + words[i];
        const testWidth = context.measureText(testLine).width;
        
        if(testWidth > maxWidth && line !== '') {
            lines.push(line);
            line = words[i];
        } else {
            line = testLine;
        }
    }

    if(line) {
        lines.push(line);
    }
}

export const toLine = function(size, gap, count) {
    return (size + gap) * count;
}

export const getFrameIndex = function(timestamp, frames, frameTime) {
    const currentFrameTime = timestamp % (frames * frameTime);
    const frameIndex = Math.floor(currentFrameTime / frameTime);

    return frameIndex;
}

export const isDrawTime = function(timestamp, between, frameTime) {
    return getFrameIndex(timestamp, between, frameTime) === 0;
}