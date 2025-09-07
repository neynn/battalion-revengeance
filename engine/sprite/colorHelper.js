export const ColorHelper = {
    getBitmapData: function(bitmap) {
        const { width, height } = bitmap;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(bitmap, 0, 0);

        return ctx.getImageData(0, 0, width, height);
    },
    mapFrame: function(buffer, bufferWidth, colorMap, frameX, frameY, frameW, frameH) {
        for(let i = 0; i < frameH; i++) {
            const rowStart = (frameY + i) * bufferWidth + frameX;

            for(let j = 0; j < frameW; j++) {
                const index = (rowStart + j) * 4;

                const r = buffer[index];
                const g = buffer[index + 1];
                const b = buffer[index + 2];
                
                const colorKey = (r << 16) | (g << 8) | b;
                const mappedColor = colorMap[colorKey];

                if(mappedColor) {
                    const [nr, ng, nb] = mappedColor;

                    buffer[index] = nr;
                    buffer[index + 1] = ng;
                    buffer[index + 2] = nb;
                }
            }
        }
    },
    mapColors: function(imageData, regions, colorMap) {
        const { data, width, height } = imageData;
        const copy = new Uint8ClampedArray(data.length);

        copy.set(data);

        for(const frameID in regions) {
            const { x, y, w, h } = regions[frameID];

            ColorHelper.mapFrame(copy, width, colorMap, x, y, w, h);
        }

        return new ImageData(copy, width, height);
    }
};