export const isRectangleRectangleIntersect = function(x1, y1, width1, height1, x2, y2, width2, height2) {
    return x1 + width1 >= x2 && x1 <= x2 + width2 && y1 + height1 >= y2 && y1 <= y2 + height2;
}

export const isPointPointIntersect = function(x1, x2, y1, y2) {
    return x1 === x2 && y1 === y2;
}
  
export const isCircleRectangleIntersect = function(circleX, circleY, circleRadius, rectangleX, rectangleY, rectangleWidth, rectangleHeight) {
    const closestX = Math.max(rectangleX, Math.min(circleX, rectangleX + rectangleWidth));
    const closestY = Math.max(rectangleY, Math.min(circleY, rectangleY + rectangleHeight));
    
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    const radiusSquared = circleRadius * circleRadius;

    return distanceSquared < radiusSquared;
}
  
export const isCircleCicleIntersect = function(cx1, cy1, r1, cx2, cy2, r2) {
	const distanceX = cx1 - cx2;
	const distanceY = cy1 - cy2;
	const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
	const radiiSum = r1 + r2;
  
	return distanceSquared < (radiiSum * radiiSum);
}

export const toRadian = function(degree) {
  	return degree * Math.PI / 180;
}

export const toAngle = function(radian) {
	return radian * 180 / Math.PI;
}

export const normalizeAngle = function(degree) {
	return ((degree % 360) + 360) % 360;
}

export const normalizeValue = function(value, min, max) {
	return (value - min) / (max - min);
}

export const lerpValue = function(start, end, factor) {
	return start + (end - start) * factor;
}
  
export const clampValue = function(value, upperLimit, lowerLimit) {
	if(value > upperLimit) {
		return upperLimit;
	} else if (value < lowerLimit) {
		return lowerLimit;
	}

	return value;
}

export const getRandomNumber = function(param_minVal, param_maxVal) {
	param_maxVal -= param_minVal;
	param_maxVal++;

	let val = Math.random() * param_maxVal;
	val = Math.floor(val);
	val += param_minVal;

	return val;
}

export const getDistance = function(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export const getRandomElement = function(list) {
	return list[Math.floor(Math.random() * list.length)];
}

export const loopValue = function(value, upperLimit, lowerLimit) {
	if(value > upperLimit) {
	  return lowerLimit;
	} else if(value < lowerLimit) {
	  return upperLimit;
	}
  
	return value;
}

/**
 * Random number between 1 and 100.
 * 
 * @returns {int}
 */
export const getRandomChance = function() {
	const random = Math.random() * 100;
	const chance = Math.floor(random) + 1;

	return chance;
}