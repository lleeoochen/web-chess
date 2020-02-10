//Intialize global variables
var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var turn = TEAM.W;


//Game
function initGame() {
	canvasLayer.addEventListener("click", onClick, false);
	initBoard();
	initPieces();
}


//Intialize chessboard background
function initBoard(){
	context.fillStyle = COLOR_BOARD_LIGHT;
	context.fillRect(0, 0, BOARD_SIZE * GRID_SIZE_P, BOARD_SIZE * GRID_SIZE_P); //Draw board outline

	for (var x = 0; x < BOARD_SIZE; x++) {
		for (var y = 0; y < BOARD_SIZE; y++) {
			color = (y % 2 != 0) ^ (x % 2 == 0) ? COLOR_BOARD_DARK : COLOR_BOARD_LIGHT;
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
	initEachPiece(4, 0, TEAM.B, CHESS.Queen);
	initEachPiece(3, 0, TEAM.B, CHESS.King);

	initEachPiece(0, 7, TEAM.W, CHESS.Rook);
	initEachPiece(7, 7, TEAM.W, CHESS.Rook);
	initEachPiece(1, 7, TEAM.W, CHESS.Knight);
	initEachPiece(6, 7, TEAM.W, CHESS.Knight);
	initEachPiece(2, 7, TEAM.W, CHESS.Bishop);
	initEachPiece(5, 7, TEAM.W, CHESS.Bishop);
	initEachPiece(4, 7, TEAM.W, CHESS.Queen);
	initEachPiece(3, 7, TEAM.W, CHESS.King);

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
	imageHTML.setAttribute("draggable", "false");
	actionLayer.append(imageHTML);
	chessboard[x][y].piece = PieceFactory.createPiece(team, type, imageHTML);
}


//Handle all chessboard click events
function onClick(event) {

	//Check boundary and initialize newGrid selection
	let x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	let y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);
	if (x >= BOARD_SIZE || y >= BOARD_SIZE)
		return;

	//Handle chess event with (x, y) click coordinate
	handleChessEvent(x, y);
}


//Handle chess event with (x, y) click coordinate
function handleChessEvent(x, y) {

	// //Thinking...
	// canvasLayer.removeAttribute("onclick");
	// setTimeout(function(){
	// 	moveChessAI();
	// 	canvasLayer.addEventListener("click", onClick, false);
	// },500);

	//Initalize important variables
	let newGrid = chessboard[x][y];
	let isLegal = isLegalMove(newGrid);


	//Action1 - Deselect Piece by clicking on illegal grid
	if (oldGrid != null && !isLegal) {
		fillGrid(oldGrid, COLOR_ORIGINAL);
		clearMoves();
		oldGrid = null;
	}

	//Action2 - Select Piece by clicking on grid with active team.
	else if (newGrid.piece != null && newGrid.piece.team == turn) {
		fillGrid(newGrid, COLOR_HIGHLIGHT);
		updateMoves(newGrid);
		oldGrid = newGrid;
	}

	//Action3 - Move Piece by clicking on empty grid or eat enemy by clicking on legal grid. Switch turn.
	else if (oldGrid != null && oldGrid.piece != null && isLegal) {
		fillGrid(oldGrid, COLOR_ORIGINAL);
		moveChess(oldGrid, newGrid);
		clearMoves();
		switchTurn();
		oldGrid = null;

		//Thinking...
		canvasLayer.removeAttribute("onclick");
		setTimeout(function(){
			moveChessAI();
			canvasLayer.addEventListener("click", onClick, false);
		},500);
	}
}

//Move chess from oldGrid to newGrid
function moveChessAI() {
	let moved = false;
	let bestMoves = [];
	let worstCost = [];

	for (let i = 0; i < chessboard.length; i++) {
		for (let j = 0; j < chessboard.length; j++) {

			let grid = chessboard[i][j];
			if (grid.piece != null && grid.piece.team == turn) {

				let moves = grid.piece.getPossibleMoves(chessboard, grid);
				let tempBoard = copyBoard(chessboard);
				let chosenMove = getBestMoves(tempBoard, grid, moves, turn);

				// Keeps track of best move(s)
				if (chosenMove.bestMove != null) {
					if (bestMoves.length == 0 || chosenMove.bestValue > bestMoves[0].bestValue)
						bestMoves = [chosenMove];
					else if (chosenMove.bestValue == bestMoves[0].bestValue)
						bestMoves.push(chosenMove);
				}

				// Keeps track of worst opportunity cost move(s)
				if (chosenMove.worstMove != null) {
					if (worstCost.length == 0 || chosenMove.worstValue < worstCost[0].worstValue)
						worstCost = [chosenMove];
					else if (chosenMove.worstValue == worstCost[0].worstValue)
						worstCost.push(chosenMove);
				}

			}
		}
	}

	// Chose moves from worst cost list if the cost is larger than best mvoe list
	// bestMoves = bestMoves.sort(worseValueSortReverse);
	// worstCost = worstCost.sort(worseValueSortReverse);
	// let chosenMoves = (bestMoves.length > 0 && worstCost.length > 0 && -worstCost[0].worstValue > bestMoves[0].bestValue) ? worstCost : bestMoves;

	// Select best moves that have the lowest worst value
	let chosenMoves = bestMoves.sort(worseValueSort);
	let lastBestIndex = 0;
	for (; lastBestIndex < chosenMoves.length; lastBestIndex++)
		if (chosenMoves[lastBestIndex].worstValue > chosenMoves[0].worstValue)
			break;

	// Select a random move from an equally good move
	let randomIndex = Math.floor(Math.random() * lastBestIndex);
	let bestMove = bestMoves[randomIndex];

	// Start a move or throw an error
	if (bestMove != undefined && bestMove.bestMove != null)
		moveChess(bestMove.grid, chessboard[bestMove.bestMove.x][bestMove.bestMove.y]);
	else
		swal("Stalemate. No body wins.");
	
	switchTurn();
	return;
}


//Get best moves
function getBestMoves(board, curGrid, moves, team) {

	let enemyTeam = team == TEAM.B ? TEAM.W : TEAM.B;
	let stayingCost = getMoveScore(board, curGrid, team, 2);
	let bestValue = undefined;
	let bestMove = null;
	let worstValue = undefined;
	let worstMove = null;

	for (let count = 0; count < moves.length; count++) {

		let tempBoard = copyBoard(board);
		let keyGrid = board[moves[count].x][moves[count].y];

		// Simulate a test move
		tempBoard[keyGrid.x][keyGrid.y].piece = curGrid.piece;
		tempBoard[curGrid.x][curGrid.y].piece = keyGrid.piece;

		// Calculate move score up to next 3 steps. The multiplier makes AI more aggressive.
		let steps = 3;
		let curValue = getMoveScore(tempBoard, tempBoard[keyGrid.x][keyGrid.y], team, steps) + (keyGrid.piece ? keyGrid.piece.value : 0) * Math.pow(2, steps);

		// Revert back the test move
		tempBoard[keyGrid.x][keyGrid.y].piece = keyGrid.piece;
		tempBoard[curGrid.x][curGrid.y].piece = curGrid.piece;

		if (bestValue == undefined || curValue > bestValue) {
			bestValue = curValue;
			bestMove = moves[count];
		}

		if (worstValue == undefined || curValue < worstValue) {
			worstValue = curValue;
			worstMove = moves[count];
		}
	}

	if (bestValue == undefined)
		bestValue = 0;

	if (worstValue == undefined)
		worstValue = bestValue;

	if (stayingCost - bestValue >= 2)
		bestMove = null;

	worstValue += bestValue;
	return {worstValue:worstValue, bestValue: bestValue, bestMove:bestMove, grid:curGrid};
}

// Get overall score after a move is made
function getMoveScore(board, grid, team, steps) {
	let enemies = getValidPieces(board, grid, team).enemies.sort(gridSortReverse);

	// Base case: if opponent team has no enemy left or recursive steps reaches 0
	if (steps <= 0 || enemies.length <= 0) return 0;

	// Make a board copy for move simulation
	let tempBoard = copyBoard(board);
	let bestScore = -9999;

	// Calculate the best score when enemies eat you at @grid
	for (let i in enemies) {
		let enemy = enemies[i];
		let baseValue = grid.piece ? grid.piece.value : 0;

		// Simulate enemy move to eat you
		tempBoard[grid.x][grid.y].piece = enemy.piece;
		tempBoard[enemy.x][enemy.y].piece = null;

		// Base value: the score enemy earns by eating your current piece
		// Recursion:  the score enemy gets in consequence of eating you
		// Minue one:  penalizes simulation that goes too deep into the future (less likely to be adopted)
		let score = - baseValue - getMoveScore(tempBoard, tempBoard[grid.x][grid.y], enemy.piece.team, steps - 1) - 1;
		if (score > bestScore) bestScore = score;

		// Revert back move simulation
		tempBoard[enemy.x][enemy.y].piece = enemy.piece;
		tempBoard[grid.x][grid.y].piece = grid.piece;
	}

	return bestScore;
}

//Get all valid friends and enemies that can eat keyGrid
function getValidPieces(board, keyGrid, team) {
	let friends = [];
	let enemies = [];

	let keyPiece = keyGrid.piece;
	keyGrid.piece = PieceFactory.createPiece(team, CHESS.None, null);
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board.length; j++) {
			let grid = board[i][j];
			if (grid.piece != null) {
				let validMoves = grid.piece.getPossibleMoves(board, grid);

				let found = false;
				for (let k = 0; k < validMoves.length && !found; k++)
					if (validMoves[k].x == keyGrid.x && validMoves[k].y == keyGrid.y)
						found = true;

				if (found) {
					if (grid.piece.team == team)
						friends.push(grid);
					else
						enemies.push(grid);
				}

			}
		}
	}

	keyGrid.piece = keyPiece;
	return {friends: friends, enemies: enemies};
}


//Move chess from oldGrid to newGrid
function moveChess(oldGrid, newGrid) {

	//Remove chess piece being eaten 
	if (newGrid.piece != null) {
		actionLayer.removeChild(newGrid.piece.image);
		if (newGrid.piece.type == CHESS.King)
			swal({
				title: `Checkmate. ${ newGrid.piece.team == TEAM.B ? "White" : "Black" } Team Wins!`
			}, () => {
				window.location.reload();
			});
	}

	//Move chess piece from old grid to current grid.
	newGrid.piece = oldGrid.piece;
	newGrid.piece.image.setAttribute("class", "x" + newGrid.x + " y" + newGrid.y);
	oldGrid.piece = null;
	oldGrid = null;
}


//Update and show all possible moves based on a specific grid
function updateMoves(grid) {
	moves = grid.piece.getPossibleMoves(chessboard, grid);
	setMovesColor(COLOR_HIGHLIGHT);
}


//Clear and hide all possible moves
function clearMoves() {
	setMovesColor(COLOR_ORIGINAL);
	moves = [];
}


//Set grid color for all possible moves
function setMovesColor(color) {
	for (var i = 0; i < moves.length; i++)
		fillGrid(chessboard[moves[i].x][moves[i].y], color);
}


//Set grid color
function fillGrid(grid, color) {
	if (grid == null)
		return;

	if (color == COLOR_ORIGINAL)
		color = grid.color;

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
	if (turn == TEAM.B)
		turn = TEAM.W;
	else
		turn = TEAM.B;
}


function copyBoard(board) {
	let newBoard = [[],[],[],[],[],[],[],[]];
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board.length; j++) {
			newBoard[i][j] = jQuery.extend(true, {}, board[i][j]);
		}
	}
	return newBoard;
}


function gridSort(a, b) {
	return a.piece.value - b.piece.value;
}

function gridSortReverse(a, b) {
	return b.piece.value - a.piece.value;
}

function worseValueSort(a, b) {
	return a.worstValue - b.worstValue;
}

function worseValueSortReverse(a, b) {
	return b.worstValue - a.worstValue;
}

function gridListToString(list) {
	let result = "";
	for (let i in list)
		result += gridToString(list[i]) + "\n";
	return result;
}

function gridToString(grid) {
	let result = "";
	for (let key in grid) {
		if (typeof grid[key] == 'object')
			for (let objKey in grid[key])
				result += key + "[" + objKey + "]-" + grid[key][objKey] + "; ";
		result += key + "-" + grid[key] + "; ";
	}
	return result;
}