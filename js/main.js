//Main
var canvas = document.getElementById("canvas");
var board = document.getElementById("board");
var context = canvas.getContext("2d");
var pieces = [[],[],[],[],[],[],[],[]];
var oldGrid = null;

canvas.addEventListener("click", onClick, false);
draw();

function draw() {
	drawBoard();
	drawChess();
}

//Draw chess board background
function drawBoard(){
	context.fillStyle = COLOR_BOARD_LIGHT;
	context.fillRect(0, 0, BOARD_SIZE * GRID_SIZE_P, BOARD_SIZE * GRID_SIZE_P); //Draw board outline

	for (var x = 0; x < BOARD_SIZE; x++) {
	    for (var y = 0; y < BOARD_SIZE; y++) {
			color = (y % 2 == 0 && x % 2 == 0 || y % 2 != 0 && x % 2 != 0)? COLOR_BOARD_DARK : COLOR_BOARD_LIGHT;
			pieces[x][y] = new Grid(x, y, null, color);
			fillGrid(pieces[x][y], color);
	    }
	}
}


function drawChess() {
	drawEachChess(0, 0, "assets/BRook.svg");
	drawEachChess(7, 0, "assets/BRook.svg");
	drawEachChess(1, 0, "assets/BKnight.svg");
	drawEachChess(6, 0, "assets/BKnight.svg");
	drawEachChess(2, 0, "assets/BBishop.svg");
	drawEachChess(5, 0, "assets/BBishop.svg");
	drawEachChess(3, 0, "assets/BQueen.svg");
	drawEachChess(4, 0, "assets/BKing.svg");

	drawEachChess(0, 7, "assets/WRook.svg");
	drawEachChess(7, 7, "assets/WRook.svg");
	drawEachChess(1, 7, "assets/WKnight.svg");
	drawEachChess(6, 7, "assets/WKnight.svg");
	drawEachChess(2, 7, "assets/WBishop.svg");
	drawEachChess(5, 7, "assets/WBishop.svg");
	drawEachChess(3, 7, "assets/WQueen.svg");
	drawEachChess(4, 7, "assets/WKing.svg");

	for (var x = 0; x < BOARD_SIZE; x++) {
		drawEachChess(x, 1, "assets/BPawn.svg");
		drawEachChess(x, 6, "assets/WPawn.svg");
	}
}


function drawEachChess(x, y, image_file) {
	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("src", image_file);
	imageHTML.setAttribute("class", "x" + x + " y" + y);
	imageHTML.setAttribute("onClick", "onClick(event)");
	board.append(imageHTML);
	pieces[x][y].image = imageHTML;
}


function onClick(event) {

	//Check boundary and initialize newGrid
	let x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	let y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);
	if (x >= BOARD_SIZE || y >= BOARD_SIZE) { return; }
	let newGrid = pieces[x][y];

	//Cancel selection when clicking the same grid
	if (newGrid == oldGrid) {
		fillGrid(oldGrid, oldGrid.color);
		oldGrid = null;
		return;
	}

	//Move selection highlights from old to new grid
	if (oldGrid != null)
		fillGrid(oldGrid, oldGrid.color);
	fillGrid(newGrid, COLOR_HIGHLIGHT);

	//Move chess piece
	let moved = false;
	if (oldGrid != null && oldGrid.image != null)
		moved = moveChess(oldGrid, newGrid)

	//Deselect grid if a move is successful
	if (moved) {
		fillGrid(newGrid, newGrid.color);
		oldGrid = null;
		return;
	}

	//Save current grid as the old grid
	oldGrid = newGrid;
	console.log(oldGrid);
}

function moveChess(oldGrid, newGrid) {
	newGrid.image = oldGrid.image;
	newGrid.image.setAttribute("class", "x" + newGrid.x + " y" + newGrid.y);
	oldGrid.image = null;
	oldGrid = null;
	return false;
}


function repaint() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	draw();
}


function fillGrid(grid, color) {
	context.fillStyle = color;
	context.fillRect(grid.x * GRID_SIZE_P, grid.y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}