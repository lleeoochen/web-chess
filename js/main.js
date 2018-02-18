var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var shown = false;
var turn = TEAM.B;

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
	initEachPiece(0, 0, TEAM.B, CHESS.Rook);
	initEachPiece(7, 0, TEAM.B, CHESS.Rook);
	initEachPiece(1, 0, TEAM.B, CHESS.Knight);
	initEachPiece(6, 0, TEAM.B, CHESS.Knight);
	initEachPiece(2, 0, TEAM.B, CHESS.Bishop);
	initEachPiece(5, 0, TEAM.B, CHESS.Bishop);
	initEachPiece(3, 0, TEAM.B, CHESS.Queen);
	initEachPiece(4, 0, TEAM.B, CHESS.King);

	initEachPiece(0, 7, TEAM.W, CHESS.Rook);
	initEachPiece(7, 7, TEAM.W, CHESS.Rook);
	initEachPiece(1, 7, TEAM.W, CHESS.Knight);
	initEachPiece(6, 7, TEAM.W, CHESS.Knight);
	initEachPiece(2, 7, TEAM.W, CHESS.Bishop);
	initEachPiece(5, 7, TEAM.W, CHESS.Bishop);
	initEachPiece(3, 7, TEAM.W, CHESS.Queen);
	initEachPiece(4, 7, TEAM.W, CHESS.King);

	for (var x = 0; x < BOARD_SIZE; x++) {
		initEachPiece(x, 1, TEAM.B, CHESS.Pawn);
		initEachPiece(x, 6, TEAM.W, CHESS.Pawn);
	}
}


function initEachPiece(x, y, team, type) {
	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("src", "assets/" + team + type + ".svg");
	imageHTML.setAttribute("class", "x" + x + " y" + y);
	imageHTML.setAttribute("onClick", "onClick(event)");
	actionLayer.append(imageHTML);
	chessboard[x][y].piece = new Piece(team, type, imageHTML);
}


function onClick(event) {

	//Check boundary and initialize newGrid selection
	let x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	let y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);
	if (x >= BOARD_SIZE || y >= BOARD_SIZE)
		return;

	//Cancel move if 1) the old grid has nothing, and 2) the new grid is opposite team.
	let newGrid = chessboard[x][y];
	if ((oldGrid == null || oldGrid.piece == null) && newGrid.piece != null && newGrid.piece.team != turn)
		return;

	//Move chess piece. Switch turn if the move is successful.
	let successMove = moveChess(oldGrid, newGrid);
	if (successMove)
		turn = (turn == TEAM.B) ? TEAM.W : TEAM.B;

	//Highlight possible moves.
	if (!successMove && oldGrid != newGrid) {
		clearMoves();
		showsMoves(newGrid);
	}
	else {
		if (shown)
			clearMoves();
		else
			showsMoves(newGrid);
	}

	//Deselect grid if a move is successful or if clicking on same grid
	if (successMove || newGrid == oldGrid)
		deselect(newGrid);
	else
		oldGrid = newGrid;
}


function moveChess(oldGrid, newGrid) {

	//No chess piece to move. Exit.
	if (oldGrid == null || oldGrid.piece == null)
		return false;

	//Check legal move of chess piece
	let legalMove = false;
	for (let i = 0; i < moves.length && !legalMove; i++)
		if (newGrid.x == moves[i].x && newGrid.y == moves[i].y)
			legalMove = true;

	//Exit if it's not a legal move
	if (!legalMove)
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


function showsMoves(grid) {
	moves = getPossibleMoves(chessboard, grid);
	setMovesColor(COLOR_HIGHLIGHT);
	shown = true;
}


function clearMoves() {
	setMovesColor(COLOR_ORIGINAL);
	moves = [];
	shown = false;
}


function setMovesColor(color) {
	for (var i = 0; i < moves.length; i++) {
		if (color == COLOR_ORIGINAL)
			fillGrid(moves[i], chessboard[moves[i].x][moves[i].y].color);
		else
			fillGrid(moves[i], color);
	}
}

function fillGrid(grid, color) {
	context.fillStyle = color;
	context.fillRect(grid.x * GRID_SIZE_P, grid.y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}


function deselect(grid) {
	fillGrid(grid, grid.color);
	oldGrid = null;
}