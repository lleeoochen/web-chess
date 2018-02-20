//Intialize global variables
var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var turn = TEAM.B;

//---------------------------------------------------
//--------------Main for the Web Chess---------------
//---------------------------------------------------
canvasLayer.addEventListener("click", onClick, false);
initBoard();
initPieces();


//Intialize chessboard background
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


//Intialize all chess pieces
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


//Intialize each chess piece
function initEachPiece(x, y, team, type) {
	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("src", "assets/" + team + type + ".svg");
	imageHTML.setAttribute("class", "x" + x + " y" + y);
	imageHTML.setAttribute("onClick", "onClick(event)");
	actionLayer.append(imageHTML);
	chessboard[x][y].piece = new Piece(team, type, imageHTML);
}


//Handle all chessboard click events
function onClick(event) {

	//Check boundary and initialize newGrid selection
	let x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	let y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);
	if (x >= BOARD_SIZE || y >= BOARD_SIZE)
		return;

	//Initalize important variables
	let newGrid = chessboard[x][y];
	let isLegal = isLegalMove(newGrid);


	//Action1 - Deselect Piece by clicking on illegal grid
	if (oldGrid != null && !isLegal) {
		clearMoves();
		oldGrid = null;
	}

	//Action2 - Select Piece by clicking on grid with active team.
	else if (newGrid.piece != null && newGrid.piece.team == turn) {
		updateMoves(newGrid);
		oldGrid = newGrid;
	}

	//Action3 - Move Piece by clicking on empty grid or eat enemy by clicking on legal grid. Switch turn.
	else if (oldGrid != null && oldGrid.piece != null && isLegal) {
		moveChess(oldGrid, newGrid);
		clearMoves();
		switchTurn();
		oldGrid = null;
	}
}


//Move chess from oldGrid to newGrid
function moveChess(oldGrid, newGrid) {

	//Remove chess piece being eaten 
	if (newGrid.piece != null)
		actionLayer.removeChild(newGrid.piece.image);

	//Move chess piece from old grid to current grid.
	newGrid.piece = oldGrid.piece;
	newGrid.piece.image.setAttribute("class", "x" + newGrid.x + " y" + newGrid.y);
	oldGrid.piece = null;
	oldGrid = null;
}


//Update and show all possible moves based on a specific grid
function updateMoves(grid) {
	moves = getPossibleMoves(chessboard, grid);
	setMovesColor(COLOR_HIGHLIGHT);
}


//Clear and hide all possible moves
function clearMoves() {
	setMovesColor(COLOR_ORIGINAL);
	moves = [];
}


//Set grid color for all possible moves
function setMovesColor(color) {
	for (var i = 0; i < moves.length; i++) {
		if (color == COLOR_ORIGINAL)
			fillGrid(moves[i], chessboard[moves[i].x][moves[i].y].color);
		else
			fillGrid(moves[i], color);
	}
}


//Set grid color
function fillGrid(grid, color) {
	context.fillStyle = color;
	context.fillRect(grid.x * GRID_SIZE_P, grid.y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}


//Check legal move of chess piece
function isLegalMove(grid) {
	let legalMove = false;
	for (let i = 0; i < moves.length && !legalMove; i++)
		if (grid.x == moves[i].x && grid.y == moves[i].y)
			legalMove = true;
	return legalMove;
}


//Switch active team turn
function switchTurn() {
	turn = (turn == TEAM.B) ? TEAM.W : TEAM.B;
}