function Grid(x, y, image, color) {
	this.x = x;
	this.y = y;
	this.image = image;
	this.color = color;
}

Grid.prototype.inBound = function(pixel_x, pixel_y) {
	let leftBound 	= this.x * GRID_SIZE_P + OFFSET_X_P;
	let rightBound 	= leftBound + GRID_SIZE_P;
	let topBound 	= this.y * GRID_SIZE_P + OFFSET_Y_P;
	let bottomBound = topBound + GRID_SIZE_P;
    return (leftBound < pixel_x && pixel_x < rightBound) && (topBound < pixel_y && pixel_y < bottomBound);
};