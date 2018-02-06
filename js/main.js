//Main
var canvas = document.getElementById("canvas");
var board = document.getElementById("board");
var context = canvas.getContext("2d");
var pieces = [[],[],[],[],[],[],[],[]];
var selectedX = -1;
var selectedY = -1;

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
			fillGrid(x, y, color);
			pieces[x][y] = new Grid(x, y, null, color);
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
	var x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	var y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);

	if (x >= BOARD_SIZE || y >= BOARD_SIZE)
		return;

	if (selectedX >= 0 && selectedY >= 0) {
		fillGrid(selectedX, selectedY, pieces[selectedX][selectedY].color);

		if (pieces[selectedX][selectedY].image != null) {
			let tmpImage = pieces[selectedX][selectedY].image;
			pieces[selectedX][selectedY].image = null;
			pieces[x][y].image = tmpImage;
			pieces[x][y].image.setAttribute("class", "x" + x + " y" + y);

			fillGrid(x, y, pieces[x][y].color);
			selectedX = -1;
			selectedY = -1;
			return;
		}
	}

	fillGrid(x, y, COLOR_HIGHLIGHT);
	selectedX = x;
	selectedY = y;
	console.log(pieces[selectedX][selectedY]);
}


function repaint() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	draw();
}


function fillGrid(x, y, color) {
	context.fillStyle = color;
	context.fillRect(x * GRID_SIZE_P, y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}