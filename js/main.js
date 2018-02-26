//Intialize global variables
var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var turn = TEAM.W;

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

			if (y % 2 == 0 && x % 2 == 0 || y % 2 != 0 && x % 2 != 0)
				color = COLOR_BOARD_DARK;
			else
				color = COLOR_BOARD_LIGHT;

			chessboard[x][y] = new Grid(x, y, color, null);
			fillGrid(chessboard[x][y], color);
		}
	}
}


//Intialize all chess pieces
function initPieces() {
	// initEachPiece(0, 0, TEAM.B, VALUE.Knight, CHESS.Knight);
	// initEachPiece(3, 3, TEAM.W, VALUE.Knight, CHESS.Knight);
	// initEachPiece(1, 2, TEAM.B, VALUE.Pawn, CHESS.Pawn);
	// initEachPiece(2, 3, TEAM.W, VALUE.Pawn, CHESS.Pawn);
	// initEachPiece(3, 2, TEAM.W, VALUE.Pawn, CHESS.Pawn);
	// initEachPiece(2, 1, TEAM.B, VALUE.Bishop, CHESS.Bishop);
	// initEachPiece(3, 0, TEAM.B, VALUE.Bishop, CHESS.Bishop);

	initEachPiece(0, 0, TEAM.B, VALUE.Rook, CHESS.Rook);
	initEachPiece(7, 0, TEAM.B, VALUE.Rook, CHESS.Rook);
	initEachPiece(1, 0, TEAM.B, VALUE.Knight, CHESS.Knight);
	initEachPiece(6, 0, TEAM.B, VALUE.Knight, CHESS.Knight);
	initEachPiece(2, 0, TEAM.B, VALUE.Bishop, CHESS.Bishop);
	initEachPiece(5, 0, TEAM.B, VALUE.Bishop, CHESS.Bishop);
	initEachPiece(3, 0, TEAM.B, VALUE.Queen, CHESS.Queen);
	initEachPiece(4, 0, TEAM.B, VALUE.King, CHESS.King);

	initEachPiece(0, 7, TEAM.W, VALUE.Rook, CHESS.Rook);
	initEachPiece(7, 7, TEAM.W, VALUE.Rook, CHESS.Rook);
	initEachPiece(1, 7, TEAM.W, VALUE.Knight, CHESS.Knight);
	initEachPiece(6, 7, TEAM.W, VALUE.Knight, CHESS.Knight);
	initEachPiece(2, 7, TEAM.W, VALUE.Bishop, CHESS.Bishop);
	initEachPiece(5, 7, TEAM.W, VALUE.Bishop, CHESS.Bishop);
	initEachPiece(3, 7, TEAM.W, VALUE.Queen, CHESS.Queen);
	initEachPiece(4, 7, TEAM.W, VALUE.King, CHESS.King);

	for (var x = 0; x < BOARD_SIZE; x++) {
		initEachPiece(x, 1, TEAM.B, VALUE.Pawn, CHESS.Pawn);
		initEachPiece(x, 6, TEAM.W, VALUE.Pawn, CHESS.Pawn);
	}
}


//Intialize each chess piece
function initEachPiece(x, y, team, value, type) {
	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("src", "assets/" + team + type + ".svg");
	imageHTML.setAttribute("class", "x" + x + " y" + y);
	imageHTML.setAttribute("onClick", "onClick(event)");
	actionLayer.append(imageHTML);
	chessboard[x][y].piece = new Piece(team, type, value, imageHTML);
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

	//Thinking...
	canvasLayer.removeAttribute("onclick");
	setTimeout(function(){
		moveChessAI();
		canvasLayer.addEventListener("click", onClick, false);
	},500);

	// //Initalize important variables
	// let newGrid = chessboard[x][y];
	// let isLegal = isLegalMove(newGrid);


	// //Action1 - Deselect Piece by clicking on illegal grid
	// if (oldGrid != null && !isLegal) {
	// 	fillGrid(oldGrid, COLOR_ORIGINAL);
	// 	clearMoves();
	// 	oldGrid = null;
	// }

	// //Action2 - Select Piece by clicking on grid with active team.
	// else if (newGrid.piece != null && newGrid.piece.team == turn) {
	// 	fillGrid(newGrid, COLOR_HIGHLIGHT);
	// 	updateMoves(newGrid);
	// 	oldGrid = newGrid;
	// }

	// //Action3 - Move Piece by clicking on empty grid or eat enemy by clicking on legal grid. Switch turn.
	// else if (oldGrid != null && oldGrid.piece != null && isLegal) {
	// 	fillGrid(oldGrid, COLOR_ORIGINAL);
	// 	moveChess(oldGrid, newGrid);
	// 	clearMoves();
	// 	switchTurn();
	// 	oldGrid = null;

	// 	//Thinking...
	// 	canvasLayer.removeAttribute("onclick");
	// 	setTimeout(function(){
	// 		moveChessAI();
	// 		canvasLayer.addEventListener("click", onClick, false);
	// 	},500);
	// }
}

//Move chess from oldGrid to newGrid
function moveChessAI() {
	let moved = false;
	let bestGrids = [];
	let bestMoves = [];
	for (let i = 0; i < chessboard.length; i++) {
		for (let j = 0; j < chessboard.length; j++) {

			let grid = chessboard[i][j];
			if (grid.piece != null && grid.piece.team == turn) {

				let moves = getPossibleMoves(chessboard, grid);
				let tempBoard = copyBoard(chessboard);

				let chosenMove = getBestMoves(tempBoard, grid, moves, turn);
				if (chosenMove.move == null && moves.length != 0)
					chosenMove.move = moves[0];
				console.log(grid, chosenMove);

				if (chosenMove.move != null) {
					if (bestMoves.length == 0 || chosenMove.value > bestMoves[0].value) {
						bestGrids = [grid];
						bestMoves = [chosenMove];
					}
					else if (chosenMove.value == bestMoves[0].value) {
						bestGrids.push(grid);
						bestMoves.push(chosenMove);
					}
				}
			}
		}
	}

	console.log(bestGrids);
	console.log(bestMoves);
	let randomIndex = Math.floor(Math.random() * bestMoves.length);
	let bestGrid = bestGrids[randomIndex];
	let bestMove = bestMoves[randomIndex];
	if (bestMove != undefined && bestMove.move != null) {
		moveChess(bestGrid, chessboard[bestMove.move.x][bestMove.move.y]);
	}
	
	switchTurn();
	return;
}


function getBestMoves(board, curGrid, moves, team) {

	let bestValue = undefined;
	let bestMove = null;

	for (let count = 0; count < moves.length; count++) {

		let tempBoard = copyBoard(board);
		let keyGrid = tempBoard[moves[count].x][moves[count].y];
		
		let curGridValue = 0;
		if (curGrid.piece != null)
			curGridValue = curGrid.piece.value;

		let curValue = 0;
		if (keyGrid.piece != null) 
			curValue = keyGrid.piece.value;
		
		let keyTeam = null;
		if (keyGrid.piece != null) {
			keyTeam = keyGrid.piece.team;
			keyGrid.piece.team = TEAM.SPECIAL;
		}

		let validPieces = getValidPieces(tempBoard, keyGrid, team);
		let validFriends = validPieces.friends;
		let validEnemies = validPieces.enemies;
		// let combinationEnemies = permutator(validEnemies);
		// let combinationFriends = permutator(validFriends);
		
		// let eatenGrid = new Grid(0, 0, null, new Piece(TEAM.SPECIAL, 0, curGridValue, null));
		console.log("????????????", moves[count], curValue, validEnemies, validFriends);

		if (validFriends.length > validEnemies.length) {
			validFriends = validFriends.splice(0, validEnemies.length);
		}
		else if (validFriends.length < validEnemies.length) {
			validEnemies = validEnemies.splice(0, validFriends.length + 1);
		}

		let eatenGrid = validFriends[0];
		validFriends = validFriends.splice(0, validFriends.length - 1);
		for (let ii = 0; ii < validEnemies.length; ii++) {
			curValue = curValue - eatenGrid.piece.value;
			if (ii < validFriends.length) {
				curValue = curValue + validEnemies[ii].piece.value;
				eatenGrid = validFriends[ii];
			}
		}

		console.log(">>>>", curValue, bestValue);


		// for (let i = 0; i < combinationEnemies.length; i++) {
		// 	for (let j = 0; j < combinationFriends.length; j++) {
				
		// 		let enemies = combinationEnemies[i];
		// 		let friends = combinationFriends[j];
		// 		console.log("-------------", enemies, friends);

		// 		if (friends.length > enemies.length)
		// 			friends = friends.splice(0, enemies.length);

		// 		else if (friends.length < enemies.length)
		// 			enemies = enemies.splice(0, friends.length + 1);

		// 		console.log("----------111", enemies, friends);

		// 		for (let ii = 0; ii < enemies.length; ii++) {
		// 			curValue = curValue - eatenGrid.piece.value;
		// 			if (ii < friends.length) {
		// 				curValue = curValue + enemies[ii].piece.value;
		// 				eatenGrid = friends[ii];
		// 			}
		// 		}
		// 		console.log("............", curValue, keyGrid);

		// 	}
		// }
		// console.log("]", curValue);

		if (bestValue == undefined || curValue > bestValue) {
			bestValue = curValue;
			bestMove = moves[count];
		}

		if (keyGrid.piece != null && keyTeam != null)
			keyGrid.piece.team = keyTeam;
	}

	if (bestValue == undefined)
		bestValue = 0;

	return {value:bestValue, move:bestMove};
}




function getValidPieces(board, keyGrid, team) {
	let friends = [];
	let enemies = [];

	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board.length; j++) {
		
			if (board[i][j].piece != null) {
				let validMoves = getPossibleMoves(board, board[i][j]);

				let found = false;
				for (let k = 0; k < validMoves.length && !found; k++)
					if (validMoves[k].x == keyGrid.x && validMoves[k].y == keyGrid.y)
						found = true;

				if (found) {
					if (board[i][j].piece.team == team)
						friends.push(board[i][j]);
					else
						enemies.push(board[i][j]);
				}

			}
		}
	}

	return {friends: friends, enemies: enemies};
}


function permutator(inputArr) {
	var results = [];

	function permute(arr, memo) {
		var cur, memo = memo || [];

		for (var i = 0; i < arr.length; i++) {
			cur = arr.splice(i, 1);
			if (arr.length === 0) {
				results.push(memo.concat(cur));
			}
			permute(arr.slice(), memo.concat(cur));
			arr.splice(i, 0, cur[0]);
		}

		return results;
	}

	return permute(inputArr);
}























// function getBestMoves(board, curGrid, moves, depth, team) {
// 	// console.log(board, depth, team);
// 	let enemyTeam = (team == TEAM.W) ? TEAM.B : TEAM.W;
// 	let valueFlag = (team == turn) ? 1 : -1;

// 	//If no move, return 0.
// 	if (depth > 4 || moves.length == 0) {
// 		return {value:0, move:null};
// 	}

// 	//Initialize
// 	let bestMove = null;
// 	let bestValue = -300;

// 	//Loop through each move
// 	for (let i = 0; i < moves.length; i++) {

// 		//Copy new board
// 		let tempBoard = copyBoard(board);
// 		let baseValue = (tempBoard[moves[i].x][moves[i].y].piece != null) ? valueFlag * tempBoard[moves[i].x][moves[i].y].piece.value : 0;

// 		//Move to each move
// 		tempBoard[moves[i].x][moves[i].y].piece = curGrid.piece;
// 		tempBoard[curGrid.x][curGrid.y].piece = null;

// 		//Get all possible enemies
// 		let enemies = getEnemies(tempBoard, tempBoard[moves[i].x][moves[i].y]);

// 		//Get each enemy's best moves
// 		let value = baseValue + getBestMoves(tempBoard, moves[i], enemies, depth + 1, enemyTeam).value;

// 		if (team == TEAM.W && curGrid.piece != undefined && curGrid.piece.type == CHESS.Knight)
// 			console.log(tempBoard[moves[i].x][moves[i].y], baseValue, team, enemies);

// 		if (team == TEAM.B)
// 			console.log(tempBoard[moves[i].x][moves[i].y], value, team, enemies, tempBoard);

// 		//Get highest value of each move
// 		if (value > bestValue) {
// 			bestValue = value;
// 			bestMove = moves[i];
// 		}

// 	}

// 	//Return best move and best value
// 	return {value:bestValue, move:bestMove};
// }


// function getEnemies(board, targetGrid) {
// 	let enemies = []

// 	if (targetGrid.piece == null)
// 		return enemies;

// 	for (let i = 0; i < board.length; i++) {
// 		for (let j = 0; j < board[0].length; j++) {

// 			let enemyGrid = board[i][j];
// 			if (enemyGrid.piece != null && enemyGrid.piece.team != targetGrid.piece.team) {
// 				let enemyMoves = getPossibleMoves(board, enemyGrid);

// 				let found = false;
// 				for (let k = 0; k < enemyMoves.length && !found; k++)
// 					if (enemyMoves[k].x == targetGrid.x && enemyMoves[k].y == targetGrid.y)
// 						found = true;

// 				if (found)
// 					enemies.push(enemyGrid);
// 			}

// 		}
// 	}

// 	return enemies;
// }




















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