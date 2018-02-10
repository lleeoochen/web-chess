var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;

canvasLayer.addEventListener("click", onClick, false);
main();


function main() {
	initBoard();
	initPieces();
}


function initBoard(){
	context.fillStyle = COLOR_BOARD_LIGHT;
	context.fillRect(0, 0, BOARD_SIZE * GRID_SIZE_P, BOARD_SIZE * GRID_SIZE_P); //Draw board outline

	for (var x = 0; x < BOARD_SIZE; x++) {
	    for (var y = 0; y < BOARD_SIZE; y++) {
			color = (y % 2 == 0 && x % 2 == 0 || y % 2 != 0 && x % 2 != 0)? COLOR_BOARD_DARK : COLOR_BOARD_LIGHT;
			chessboard[x][y] = new Grid(x, y, color, null);
			fillGrid(chessboard[x][y], color);
	    }
	}
}


function initPieces() {
	initEachPiece(0, 0, CHESS.BRook);
	initEachPiece(7, 0, CHESS.BRook);
	initEachPiece(1, 0, CHESS.BKnight);
	initEachPiece(6, 0, CHESS.BKnight);
	initEachPiece(2, 0, CHESS.BBishop);
	initEachPiece(5, 0, CHESS.BBishop);
	initEachPiece(3, 0, CHESS.BQueen);
	initEachPiece(4, 0, CHESS.BKing);

	initEachPiece(0, 7, CHESS.WRook);
	initEachPiece(7, 7, CHESS.WRook);
	initEachPiece(1, 7, CHESS.WKnight);
	initEachPiece(6, 7, CHESS.WKnight);
	initEachPiece(2, 7, CHESS.WBishop);
	initEachPiece(5, 7, CHESS.WBishop);
	initEachPiece(3, 7, CHESS.WQueen);
	initEachPiece(4, 7, CHESS.WKing);

	for (var x = 0; x < BOARD_SIZE; x++) {
		initEachPiece(x, 1, CHESS.BPawn);
		initEachPiece(x, 6, CHESS.WPawn);
	}
}


function initEachPiece(x, y, type) {
	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("src", "assets/" + type + ".svg");
	imageHTML.setAttribute("class", "x" + x + " y" + y);
	imageHTML.setAttribute("onClick", "onClick(event)");
	actionLayer.append(imageHTML);
	chessboard[x][y].piece = new Piece(type, imageHTML);
}


function onClick(event) {

	//Check boundary and initialize newGrid selection
	let x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	let y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);
	if (x >= BOARD_SIZE || y >= BOARD_SIZE) { return; }
	let newGrid = chessboard[x][y];

	//Move chess piece
	let moved = moveChess(oldGrid, newGrid);

	//Move selection highlights from old to new grid
	if (oldGrid != null)
		fillGrid(oldGrid, oldGrid.color);
	fillGrid(newGrid, COLOR_HIGHLIGHT);

	//Deselect grid if a move is successful or if clicking on same grid
	if (moved || newGrid == oldGrid)
		deselect(newGrid);
	else
		oldGrid = newGrid
}


function moveChess(oldGrid, newGrid) {

	//No chess piece to move. Exit.
	if (oldGrid == null || oldGrid.piece == null)
		return false;

	//Handle chess pieces from last grid and current grid. 
	if (newGrid.piece != null) {

		//If same team, exit. If opposite team, erase opponent piece.
		if (oldGrid.piece.team == newGrid.piece.team) {
			return false;
		}
		else {
			actionLayer.removeChild(newGrid.piece.image);
		}
	}

	//Move chess piece from old grid to current grid.
	newGrid.piece = oldGrid.piece;
	newGrid.piece.image.setAttribute("class", "x" + newGrid.x + " y" + newGrid.y);
	oldGrid.piece = null;
	oldGrid = null;
	return true;
}


function fillGrid(grid, color) {
	context.fillStyle = color;
	context.fillRect(grid.x * GRID_SIZE_P, grid.y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}


function deselect(grid) {
	fillGrid(grid, grid.color);
	oldGrid = null;
}