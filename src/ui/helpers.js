export const mRegenerateLines = function(lines, context, text, maxWidth) {
    const words = text.split(' ');
    let line = '';

    for(let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if(testWidth > maxWidth && line !== '') {
            lines.push(line.trim());
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }

    if(line) {
        lines.push(line.trim());
    }
}

export const toLine = function(size, gap, count) {
    return (size + gap) * count;
}