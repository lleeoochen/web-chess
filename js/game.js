//Intialize global variables
var canvasLayer = document.getElementById("canvasLayer");
var actionLayer = document.getElementById("actionLayer");
var gridsLayer = document.getElementById("gridsLayer");
var piecesLayer = document.getElementById("piecesLayer");
var context = canvasLayer.getContext("2d");
var chessboard = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var turn = TEAM.W;
var match = null;
var match_id = Util.getParam("match");
var my_team = null;
var moves_applied = 0;
var king_grid = null;
var king_moved = false;
var other_king_moved = false;
var lastMove = {};

var black_title_set = false;
var white_title_set = false;
var id = 0;
var stats = {
	black: 29,
	white: 29
};


Firebase.authenticate((auth_user) => {

	Firebase.getMatch(match_id, (match_data) => {
		match = match_data;

		// Register second user if not exists
		if (!match.white && auth_user.uid != match.black) {
			Firebase.registerOpponent(match_id, auth_user.uid);
			my_team = TEAM.W;
		}

		if (auth_user.uid == match.black) {
			my_team = TEAM.B;
		}
		else if (auth_user.uid == match.white) {
			my_team = TEAM.W;
		}

		initGame();
	});

	Firebase.listenMatch(match_id, (match_data) => {
		match = match_data;

		if (auth_user.uid == match.black) {
			my_team = TEAM.B;
		}
		else if (auth_user.uid == match.white) {
			my_team = TEAM.W;
		}

		setTitleBar(auth_user);

		if (match && match.moves) {
			for (; match.moves.length != moves_applied;) {
				if (Math.floor(match.moves[moves_applied] / 10) == 0) {
					swal({title: `Checkmate. ${ match.moves[moves_applied] == 0 ? "White" : "Black" } Team Wins!`});
					return;
				}

				let move = Util.unpack(match.moves[moves_applied]);
				if (turn != my_team) {
					move.old_y = BOARD_SIZE - move.old_y - 1;
					move.new_y = BOARD_SIZE - move.new_y - 1;
				}

				moveChess(chessboard[move.old_x][move.old_y], chessboard[move.new_x][move.new_y]);
				turn = move.turn;
			}
			if (isCheckmate()) {
				Firebase.checkmate(match_id, match, my_team == TEAM.W ? TEAM.B : TEAM.W);
			}
		}
	});
});


//Game
function initGame() {
	canvasLayer.addEventListener("click", onClick, false);
	$("#white-player-icon").css("background-color", "#008640");

	updateStats();
	initBoard();
	initPieces();
}

//Set player info
function setTitleBar(auth_user) {

	if (!black_title_set) {
		if (auth_user.uid != match.black) {
			Firebase.getUser(match.black, (user_data) => {
				$('#black-player-image').attr('src', user_data.photoURL);
				$('#black-player-name').text(user_data.displayName);
				black_title_set = true;
			});
		}
		else {
			$('#black-player-image').attr('src', auth_user.photoURL);
			$('#black-player-name').text(auth_user.displayName);
			black_title_set = true;
		}
	}

	if (!white_title_set) {
		if (auth_user.uid != match.white) {
			if (match.white) {
				Firebase.getUser(match.white, (user_data) => {
					$('#white-player-image').attr('src', user_data.photoURL);
					$('#white-player-name').text(user_data.displayName);
					white_title_set = true;
				});
			}
		}
		else {
			$('#white-player-image').attr('src', auth_user.photoURL);
			$('#white-player-name').text(auth_user.displayName);
			white_title_set = true;
		}
	}
}


//Intialize chessboard background
function initBoard(){
	context.fillStyle = COLOR_BOARD_LIGHT;
	context.fillRect(0, 0, BOARD_SIZE * GRID_SIZE_P, BOARD_SIZE * GRID_SIZE_P); //Draw board outline

	let color1 = my_team == TEAM.W ? COLOR_BOARD_DARK : COLOR_BOARD_LIGHT;
	let color2 = my_team == TEAM.W ? COLOR_BOARD_LIGHT : COLOR_BOARD_DARK;

	for (var x = 0; x < BOARD_SIZE; x++) {
		for (var y = 0; y < BOARD_SIZE; y++) {
			color = (y % 2 != 0) ^ (x % 2 == 0) ? color1 : color2;
			chessboard[x][y] = new Grid(x, y, -1, color);
			fillGrid(chessboard[x][y], color);

			//Grid Listener for onclick event
			let gridListener = document.createElement("div");
			gridListener.setAttribute("class", "grid x" + x + " y" + y);
			gridListener.setAttribute("style", `z-index: 10;`)
			gridListener.setAttribute("onClick", `onClick(event, ${x}, ${y})`);
			gridsLayer.append(gridListener);
		}
	}
}


//Intialize all chess pieces
function initPieces() {
	let black_pos = 0;
	let black_pawn_pos = 1;
	let white_pos = 7;
	let white_pawn_pos = 6;

	if (my_team == TEAM.B) {
		black_pos = 7;
		black_pawn_pos = 6;
		white_pos = 0;
		white_pawn_pos = 1;
	}

	initEachPiece(id++, 0, black_pos, TEAM.B, CHESS.Rook);
	initEachPiece(id++, 7, black_pos, TEAM.B, CHESS.Rook);
	initEachPiece(id++, 1, black_pos, TEAM.B, CHESS.Knight);
	initEachPiece(id++, 6, black_pos, TEAM.B, CHESS.Knight);
	initEachPiece(id++, 2, black_pos, TEAM.B, CHESS.Bishop);
	initEachPiece(id++, 5, black_pos, TEAM.B, CHESS.Bishop);
	initEachPiece(id++, 4, black_pos, TEAM.B, CHESS.Queen);
	initEachPiece(id++, 3, black_pos, TEAM.B, CHESS.King);

	initEachPiece(id++, 0, white_pos, TEAM.W, CHESS.Rook);
	initEachPiece(id++, 7, white_pos, TEAM.W, CHESS.Rook);
	initEachPiece(id++, 1, white_pos, TEAM.W, CHESS.Knight);
	initEachPiece(id++, 6, white_pos, TEAM.W, CHESS.Knight);
	initEachPiece(id++, 2, white_pos, TEAM.W, CHESS.Bishop);
	initEachPiece(id++, 5, white_pos, TEAM.W, CHESS.Bishop);
	initEachPiece(id++, 4, white_pos, TEAM.W, CHESS.Queen);
	initEachPiece(id++, 3, white_pos, TEAM.W, CHESS.King);

	for (var x = 0; x < BOARD_SIZE; x++) {
		initEachPiece(id++, x, black_pawn_pos, TEAM.B, CHESS.Pawn);
		initEachPiece(id++, x, white_pawn_pos, TEAM.W, CHESS.Pawn);
	}
}


//Intialize each chess piece
function initEachPiece(id, x, y, team, type) {

	let imageHTML = document.createElement("img");
	imageHTML.setAttribute("class", "piece x" + x + " y" + y);
	imageHTML.setAttribute("src", "assets/" + team + type + ".svg");
	imageHTML.setAttribute("draggable", "false");
	piecesLayer.append(imageHTML);

	chessboard[x][y].piece = id;
	pieces[id] = PieceFactory.createPiece(team, type, imageHTML);

	if (my_team == team && type == CHESS.King)
		king_grid = chessboard[x][y];
}


//Handle all chessboard click events
function onClick(event, x, y) {
	//Handle chess event with (x, y) click coordinate
	handleChessEvent(x, y);
}


//Handle chess event with (x, y) click coordinate
function handleChessEvent(x, y) {
	if (my_team != turn)
		return;

	// //Thinking...
	// canvasLayer.removeAttribute("onclick");
	// setTimeout(function(){
	// 	moveChessAI();
	// 	canvasLayer.addEventListener("click", onClick, false);
	// },500);

	//Initalize important variables
	let newGrid = chessboard[x][y];
	let isLegal = isLegalMove(newGrid);
	isLegal = isLegal && isKingSafe(oldGrid, newGrid);

	//Action0 - Castle
	if (canCastle(oldGrid, newGrid)) {
		moveChess(oldGrid, newGrid);
		Firebase.updateChessboard(match_id, match, oldGrid, newGrid, turn);
		oldGrid = null;
		return;
	}

	//Action1 - Deselect Piece by clicking on illegal grid
	if (oldGrid != null && !isLegal) {
		fillGrid(oldGrid, COLOR_ORIGINAL);
		clearMoves();
		oldGrid = null;
	}

	//Action2 - Select Piece by clicking on grid with active team.
	if (newGrid.get_piece() != null && newGrid.get_piece().team == turn) {
		fillGrid(newGrid, COLOR_HIGHLIGHT);
		updateMoves(newGrid);
		oldGrid = newGrid;
	}

	//Action3 - Move Piece by clicking on empty grid or eat enemy by clicking on legal grid. Switch turn.
	else if (oldGrid != null && oldGrid.get_piece() != null && isLegal) {
		moveChess(oldGrid, newGrid);
		Firebase.updateChessboard(match_id, match, oldGrid, newGrid, turn);
		oldGrid = null;

		//Thinking...
		// canvasLayer.removeAttribute("onclick");
		// setTimeout(function(){
		// 	moveChessAI();
		// 	canvasLayer.addEventListener("click", onClick, false);
		// },500);
	}
}

// //Move chess from oldGrid to newGrid
// function moveChessAI() {
// 	let moved = false;
// 	let bestMoves = [];
// 	let worstCost = [];

// 	for (let i = 0; i < chessboard.length; i++) {
// 		for (let j = 0; j < chessboard.length; j++) {

// 			let grid = chessboard[i][j];
// 			if (grid.piece != null && grid.piece.team == turn) {

// 				let moves = grid.piece.getPossibleMoves(chessboard, grid);
// 				let tempBoard = copyBoard(chessboard);
// 				let chosenMove = getBestMoves(tempBoard, grid, moves, turn);

// 				// Keeps track of best move(s)
// 				if (chosenMove.bestMove != null) {
// 					if (bestMoves.length == 0 || chosenMove.bestValue > bestMoves[0].bestValue)
// 						bestMoves = [chosenMove];
// 					else if (chosenMove.bestValue == bestMoves[0].bestValue)
// 						bestMoves.push(chosenMove);
// 				}

// 				// Keeps track of worst opportunity cost move(s)
// 				if (chosenMove.worstMove != null) {
// 					if (worstCost.length == 0 || chosenMove.worstValue < worstCost[0].worstValue)
// 						worstCost = [chosenMove];
// 					else if (chosenMove.worstValue == worstCost[0].worstValue)
// 						worstCost.push(chosenMove);
// 				}

// 			}
// 		}
// 	}

// 	// Chose moves from worst cost list if the cost is larger than best mvoe list
// 	// bestMoves = bestMoves.sort(worseValueSortReverse);
// 	// worstCost = worstCost.sort(worseValueSortReverse);
// 	// let chosenMoves = (bestMoves.length > 0 && worstCost.length > 0 && -worstCost[0].worstValue > bestMoves[0].bestValue) ? worstCost : bestMoves;

// 	// Select best moves that have the lowest worst value
// 	let chosenMoves = bestMoves.sort(worseValueSort);
// 	let lastBestIndex = 0;
// 	for (; lastBestIndex < chosenMoves.length; lastBestIndex++)
// 		if (chosenMoves[lastBestIndex].worstValue > chosenMoves[0].worstValue)
// 			break;

// 	// Select a random move from an equally good move
// 	let randomIndex = Math.floor(Math.random() * lastBestIndex);
// 	let bestMove = bestMoves[randomIndex];

// 	// Start a move or throw an error
// 	if (bestMove != undefined && bestMove.bestMove != null)
// 		moveChess(bestMove.grid, chessboard[bestMove.bestMove.x][bestMove.bestMove.y]);
// 	else
// 		swal("Stalemate. No body wins.");
	
// 	switchTurn();
// 	return;
// }


// //Get best moves
// function getBestMoves(board, curGrid, moves, team) {

// 	let enemyTeam = team == TEAM.B ? TEAM.W : TEAM.B;
// 	let stayingCost = getMoveScore(board, curGrid, team, 2);
// 	let bestValue = undefined;
// 	let bestMove = null;
// 	let worstValue = undefined;
// 	let worstMove = null;

// 	for (let count = 0; count < moves.length; count++) {

// 		let tempBoard = copyBoard(board);
// 		let keyGrid = board[moves[count].x][moves[count].y];

// 		// Simulate a test move
// 		tempBoard[keyGrid.x][keyGrid.y].piece = curGrid.piece;
// 		tempBoard[curGrid.x][curGrid.y].piece = keyGrid.piece;

// 		// Calculate move score up to next 3 steps. The multiplier makes AI more aggressive.
// 		let steps = 3;
// 		let curValue = getMoveScore(tempBoard, tempBoard[keyGrid.x][keyGrid.y], team, steps) + (keyGrid.piece ? keyGrid.piece.value : 0) * Math.pow(2, steps);

// 		// Revert back the test move
// 		tempBoard[keyGrid.x][keyGrid.y].piece = keyGrid.piece;
// 		tempBoard[curGrid.x][curGrid.y].piece = curGrid.piece;

// 		if (bestValue == undefined || curValue > bestValue) {
// 			bestValue = curValue;
// 			bestMove = moves[count];
// 		}

// 		if (worstValue == undefined || curValue < worstValue) {
// 			worstValue = curValue;
// 			worstMove = moves[count];
// 		}
// 	}

// 	if (bestValue == undefined)
// 		bestValue = 0;

// 	if (worstValue == undefined)
// 		worstValue = bestValue;

// 	if (stayingCost - bestValue >= 2)
// 		bestMove = null;

// 	worstValue += bestValue;
// 	return {worstValue:worstValue, bestValue: bestValue, bestMove:bestMove, grid:curGrid};
// }

// // Get overall score after a move is made
// function getMoveScore(board, grid, team, steps) {
// 	let enemies = getValidPieces(board, grid, team).enemies.sort(gridSortReverse);

// 	// Base case: if opponent team has no enemy left or recursive steps reaches 0
// 	if (steps <= 0 || enemies.length <= 0) return 0;

// 	// Make a board copy for move simulation
// 	let tempBoard = copyBoard(board);
// 	let bestScore = -9999;

// 	// Calculate the best score when enemies eat you at @grid
// 	for (let i in enemies) {
// 		let enemy = enemies[i];
// 		let baseValue = grid.piece ? grid.piece.value : 0;

// 		// Simulate enemy move to eat you
// 		tempBoard[grid.x][grid.y].piece = enemy.piece;
// 		tempBoard[enemy.x][enemy.y].piece = null;

// 		// Base value: the score enemy earns by eating your current piece
// 		// Recursion:  the score enemy gets in consequence of eating you
// 		// Minue one:  penalizes simulation that goes too deep into the future (less likely to be adopted)
// 		let score = - baseValue - getMoveScore(tempBoard, tempBoard[grid.x][grid.y], enemy.piece.team, steps - 1) - 1;
// 		if (score > bestScore) bestScore = score;

// 		// Revert back move simulation
// 		tempBoard[enemy.x][enemy.y].piece = enemy.piece;
// 		tempBoard[grid.x][grid.y].piece = grid.piece;
// 	}

// 	return bestScore;
// }

//Get all valid friends and enemies that can eat keyGrid
function getValidPieces(board, keyGrid, team) {
	let friends = [];
	let enemies = [];

	let keyPiece = keyGrid.piece;
	keyGrid.piece = 100;
	pieces[100] = PieceFactory.createPiece(team, CHESS.None, null);

	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board.length; j++) {
			let grid = board[i][j];
			if (grid.get_piece() != null) {
				let downward = grid.get_piece().team != my_team;
				let validMoves = grid.get_piece().getPossibleMoves(board, grid, downward);
				let found = false;

				for (let k = 0; k < validMoves.length && !found; k++)
					if (validMoves[k].x == keyGrid.x && validMoves[k].y == keyGrid.y)
						found = true;

				if (found) {
					if (grid.get_piece().team == team)
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

function isCheckmate() {
	for (let i = 0; i < chessboard.length; i++) {
		for (let j = 0; j < chessboard.length; j++) {
			let grid = chessboard[i][j];
			if (grid.get_piece() != null && grid.get_piece().team == my_team) {
				let validMoves = grid.get_piece().getPossibleMoves(chessboard, grid);

				for (let k = 0; k < validMoves.length; k++) {
					if (isKingSafe(grid, chessboard[validMoves[k].x][validMoves[k].y])) {
						return false;
					}
				}
			}
		}
	}
	return true;
}


//Move chess from oldGrid to newGrid
function moveChess(oldGrid, newGrid) {
	if (oldGrid.get_piece() == null) return;

	//Remove chess piece being eaten 
	if (newGrid.get_piece() != null) {

		if (newGrid.get_piece().team == TEAM.B)
			stats.black -= VALUE[newGrid.get_piece().type];
		else
			stats.white -= VALUE[newGrid.get_piece().type];

		var old_img = oldGrid.get_piece().image
		var new_img = newGrid.get_piece().image;
		var newGridTeam = newGrid.get_piece().team;

		//Eating animation delay.
		old_img.style.zIndex = "1000";
		setTimeout(() => {
			piecesLayer.removeChild(new_img);
			new_img.setAttribute("class", "eaten-piece");
			old_img.style.zIndex = "0";

			if (newGridTeam == TEAM.B) {
				$('#blacksEaten').append(new_img);
			}
			else {
				$('#whitesEaten').append(new_img);
			}
		}, 300);
	}


	//Castle move
	if (my_team == oldGrid.get_piece().team && !king_moved || my_team != oldGrid.get_piece().team && !other_king_moved) {
		if (oldGrid.get_piece().type == CHESS.King) {
			let row = (oldGrid.get_piece().team == my_team) ? BOARD_SIZE - 1 : 0;
			if (newGrid.x - oldGrid.x == 2) {
				chessboard[oldGrid.x + 1][oldGrid.y].piece = chessboard[BOARD_SIZE - 1][oldGrid.y].piece;
				chessboard[oldGrid.x + 1][oldGrid.y].get_piece().image.setAttribute("class", "piece x" + (oldGrid.x + 1) + " y" + oldGrid.y);
				chessboard[BOARD_SIZE - 1][oldGrid.y].piece = -1;
			}
			else {
				chessboard[oldGrid.x - 1][oldGrid.y].piece = chessboard[0][oldGrid.y].piece;
				chessboard[oldGrid.x - 1][oldGrid.y].get_piece().image.setAttribute("class", "piece x" + (oldGrid.x - 1) + " y" + oldGrid.y);
				chessboard[0][oldGrid.y].piece = -1;
			}
		}
	}

	//King has moved, cannot castle anymore
	if (oldGrid == king_grid) {
		king_moved = true;
	}

	if (my_team != oldGrid.get_piece().team && oldGrid.get_piece().type == CHESS.King) {
		other_king_moved = true;
	}

	//Color last move
	clearMoves();
	colorLatestMove(oldGrid, newGrid);

	//Move chess piece from old grid to current grid.
	newGrid.piece = oldGrid.piece;
	newGrid.get_piece().image.setAttribute("class", "piece x" + newGrid.x + " y" + newGrid.y);

	//Pawn to Queen
	if (newGrid.get_piece().type == CHESS.Pawn) {
		if ((newGrid.get_piece().team == my_team && newGrid.y == 0) || (newGrid.get_piece().team != my_team && newGrid.y == BOARD_SIZE - 1)) {
			piecesLayer.removeChild(newGrid.get_piece().image);
			initEachPiece(id++, newGrid.x, newGrid.y, newGrid.get_piece().team, CHESS.Queen);

			if (newGrid.get_piece().team == TEAM.B)
				stats.black += VALUE[CHESS.Queen] - VALUE[CHESS.Pawn];
			else
				stats.white += VALUE[CHESS.Queen] - VALUE[CHESS.Pawn];
		}
	}

	if (oldGrid == king_grid)
		king_grid = newGrid;

	oldGrid.piece = -1;
	moves_applied += 1;
	switchTurn();
	updateStats();
}


//Update and show all possible moves based on a specific grid
function updateMoves(grid) {
	moves = grid.get_piece().getPossibleMoves(chessboard, grid);
	setMovesColor(COLOR_HIGHLIGHT);
}


function updateStats() {
	let w_stat = stats.white / (stats.white + stats.black) * 100;

	if (my_team == TEAM.B)
		$("#canvasLayer").css("background", `linear-gradient(#FFFFFFFF ${ Math.round(w_stat) }%, #000000FF)`);
	else
		$("#canvasLayer").css("background", `linear-gradient(#000000FF, #FFFFFFFF ${ Math.round(w_stat) }%)`);
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

//Set last move grid color
function colorLatestMove(oldGrid, newGrid) {
	fillGrid(lastMove.oldGrid, COLOR_ORIGINAL);
	fillGrid(lastMove.newGrid, COLOR_ORIGINAL);
	lastMove.oldGrid = oldGrid;
	lastMove.newGrid = newGrid;
	fillGrid(lastMove.oldGrid, COLOR_LAST_MOVE);
	fillGrid(lastMove.newGrid, COLOR_LAST_MOVE);
}


//Check legal move of chess piece
function isLegalMove(grid) {
	let legalMove = false;
	for (let i = 0; i < moves.length && !legalMove; i++)
		if (grid.x == moves[i].x && grid.y == moves[i].y)
			legalMove = true;
	return legalMove;
}

//Check legal move of chess piece
function isKingSafe(oldGrid, newGrid) {
	let board = copyBoard(chessboard);

	let isKingSafe = true;
	let target_grid = king_grid;

	if (oldGrid && newGrid) {
		board[newGrid.x][newGrid.y].piece = board[oldGrid.x][oldGrid.y].piece;
		board[oldGrid.x][oldGrid.y].piece = -1;

		if (oldGrid == king_grid)
			target_grid = newGrid;
	}

	let stats = getValidPieces(board, target_grid, my_team)
	let enemies = stats.enemies;
	let friends = stats.friends;

	return enemies.length == 0;
}


function canCastle(oldGrid, newGrid) {
	if (oldGrid != king_grid) return false;
	if (newGrid.y != BOARD_SIZE - 1) return false;
	if (Math.abs(newGrid.x - oldGrid.x) != 2) return false;
	if (king_moved) return false;
	if (!isKingSafe()) return false;

	let leftSide = newGrid.x - oldGrid.x < 0;
	if (leftSide) {
		for (let x = 1; x < oldGrid.x; x++)
			if (chessboard[x][BOARD_SIZE - 1].get_piece())
				return false;
		return isKingSafe(king_grid, chessboard[king_grid.x - 1][king_grid.y])
			&& isKingSafe(king_grid, chessboard[king_grid.x - 2][king_grid.y]);
	}
	else {
		for (let x = oldGrid.x + 1; x < BOARD_SIZE - 1; x++)
			if (chessboard[x][BOARD_SIZE - 1].get_piece())
				return false;
		return isKingSafe(king_grid, chessboard[king_grid.x + 1][king_grid.y])
			&& isKingSafe(king_grid, chessboard[king_grid.x + 2][king_grid.y]);
	}
}


//Switch active team turn
function switchTurn() {
	if (turn == TEAM.B) {
		turn = TEAM.W;
		$("#white-player-image").css("border", "calc(var(--picture-size) / 10) solid #008640");
		$("#black-player-image").css("border", "");
	}
	else {
		turn = TEAM.B;
		$("#black-player-image").css("border", "calc(var(--picture-size) / 10) solid #008640");
		$("#white-player-image").css("border", "");
	}
}


function copyBoard(board) {
	let newBoard = [[],[],[],[],[],[],[],[]];
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board.length; j++) {
			newBoard[i][j] = new Grid(i, j, board[i][j].piece, board[i][j].color);
		}
	}
	return newBoard;
}


function gridSort(a, b) {
	return a.get_piece().value - b.get_piece().value;
}

function gridSortReverse(a, b) {
	return b.get_piece().value - a.get_piece().value;
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