//Intialize global variables
var canvasLayer = document.getElementById("canvas-layer");
var actionLayer = document.getElementById("action-layer");
var gridsLayer = document.getElementById("grids-layer");
var piecesLayer = document.getElementById("pieces-layer");
var chessboard = [[],[],[],[],[],[],[],[]];
var background = [[],[],[],[],[],[],[],[]];
var oldGrid = null;
var moves = [];
var turn = TEAM.W;
var match = null;
var match_id = Util.getParam("match");
var my_team = null;
var moves_applied = 0;
var chats_applied = 0;
var king_grid = null;
var king_moved = false;
var other_king_moved = false;
var lastMove = {};
var first_move = true;
var black_title_set = false;
var white_title_set = false;

var interval = null;
var white_timer = MAX_TIME;
var black_timer = MAX_TIME;

var theme = null;

var id = 0;
var stats = {
	black: STATS_MAX,
	white: STATS_MAX
};
var names = {
	black: null,
	white: null
};
var pictures = {
	black: null,
	white: null,
};
var passant_pawn = null;


Firebase.authenticate((auth_user) => {

	Firebase.getMatch(match_id, (match_data) => {
		match = match_data;

		// Register second user if not exists
		if (!match.white && auth_user.uid != match.black) {
			Firebase.registerOpponent(match_id, auth_user.uid);
			my_team = TEAM.W;
		}
		else if (auth_user.uid == match.black) {
			my_team = TEAM.B;
		}
		else if (auth_user.uid == match.white) {
			my_team = TEAM.W;
		}
		else {
			my_team = TEAM.B; // spectate mode
		}

		if (my_team) {
			initGame();
		}
	});

	Firebase.listenMatch(match_id, async (match_data) => {
		// if (!my_team) return;

		match = match_data;

		if (auth_user.uid == match.black) {
			my_team = TEAM.B;
		}
		else if (auth_user.uid == match.white) {
			my_team = TEAM.W;
		}
		else {
			my_team = TEAM.B; // spectate mode
		}

		$('#game-utility-title').removeClass('hidden');
		if (match.black && match.white) {
			$('#invite-btn').addClass('hidden');
			$('#resign-btn').removeClass('hidden');
			$('#draw-btn').removeClass('hidden');
			$('#undo-btn').removeClass('hidden');
			$('#add-time-btn').removeClass('hidden');
			$('#review-btn').addClass('hidden');
		}
		else {
			$('#invite-btn').removeClass('hidden');
			$('#resign-btn').addClass('hidden');
			$('#draw-btn').addClass('hidden');
			$('#undo-btn').addClass('hidden');
			$('#add-time-btn').addClass('hidden');
			$('#review-btn').addClass('hidden');
		}

		setTitleBar(auth_user);

		changeTheme(Util.unpackTheme(match.theme));

		if (match && match.chat) {
			for (; match.chat.length != chats_applied; chats_applied++) {
				let chat = Util.unpackMessage(match.chat[chats_applied]);

				let team_name = "";
				if (chat.team == TEAM.W) team_name = names.white ? names.white : `[${chat.team}]`;
				else 					 team_name = names.black ? names.black : `[${chat.team}]`;

				if (chats_applied != 0 && chat.team == Util.unpackMessage(match.chat[chats_applied - 1]).team) {
					let message = $('#chat-messages-content').children().last().find('.chat-message-content');
					message.html(message.html() + "<br>" + chat.message);
				}
				else {
					$("#chat-messages-content").append(`
						<div class="chat-message row">
							<div class="chat-message-sender">${ team_name }</div>
							<p class="chat-message-content">${ chat.message }</p>
						</div>`);
				}

				$("#chat-messages-content").scrollTop($("#chat-messages-content")[0].scrollHeight);
				let offset = 10;
				if (!SCREEN_PORTRAIT && (window.innerHeight + window.scrollY + offset) < document.body.offsetHeight) {
					$('#chat-notification').removeAttr('hidden');
				}
			}
		}

		if (match && match.moves) {
			if (match.moves.length < moves_applied) {
				location.reload();
			}

			for (; match.moves.length != moves_applied;) {
				if (Util.gameFinished(match.moves[moves_applied])) {
					clearInterval(interval);

					$('#invite-btn').addClass('hidden');
					$('#resign-btn').addClass('hidden');
					$('#draw-btn').addClass('hidden');
					$('#undo-btn').addClass('hidden');
					$('#add-time-btn').addClass('hidden');
					$('#change-theme-btn').addClass('hidden');
					$('#review-btn').removeClass('hidden');
					return;
				}

				let move = Util.unpack(match.moves[moves_applied]);
				if (turn != my_team) {
					move.old_y = BOARD_SIZE - move.old_y - 1;
					move.new_y = BOARD_SIZE - move.new_y - 1;
				}

				await new Promise((resolve, reject) => {
				  setTimeout(() => {
					moveChess(chessboard[move.old_x][move.old_y], chessboard[move.new_x][move.new_y]);
					resolve('Promise A win!');
				  }, 50);
				})
				turn = move.turn;
			}
			switch(isCheckmate()) {
				case STATUS_CHECKMATE:
					Firebase.checkmate(match_id, match, my_team == TEAM.W ? TEAM.B : TEAM.W);
					playSound("omgwow");
					break;
				case STATUS_STALEMATE:
					Firebase.stalemate(match_id, match);
					break;
			}
		}

		if (match && match.black_undo != undefined && match.white_undo != undefined) {
			if (my_team == TEAM.B && match.white_undo == DB_REQUEST_ASK || my_team == TEAM.W && match.black_undo == DB_REQUEST_ASK) {
				swal({
					text: `${(my_team == TEAM.B) ? names.white : names.black} is once again asking for your mercy. Undo move?`,
					type: "warning",
					showCancelButton: true,
					buttons: [
					  'Cancel',
					  'Undo'
					],
					closeOnConfirm: false
				}).then((toResign) => {
					if (toResign) {
						Firebase.undoMove(match_id, match);
					}
					else {
						Firebase.cancelUndo(match_id, match);
					}
				});
			}

			if (match.moves.length == 0 || turn == my_team ||
				(my_team == TEAM.B && match.black_undo == DB_REQUEST_ASK) ||
				(my_team == TEAM.W && match.white_undo == DB_REQUEST_ASK)) {
				$('#undo-btn .btn').attr('disabled', 'disabled');
			}
			else {
				$('#undo-btn .btn').removeAttr('disabled');
			}
		}

		if (match && match.black_draw != undefined && match.white_draw != undefined) {
			if (my_team == TEAM.B && match.white_draw == DB_REQUEST_ASK || my_team == TEAM.W && match.black_draw == DB_REQUEST_ASK) {
				swal({
					text: `${(my_team == TEAM.B) ? names.white : names.black} is asking for a draw. Confirm?`,
					type: "warning",
					showCancelButton: true,
					buttons: [
					  'Cancel',
					  'Draw'
					],
					closeOnConfirm: false
				}).then((toResign) => {
					if (toResign) {
						Firebase.draw(match_id, match);
					}
					else {
						Firebase.cancelDraw(match_id, match);
					}
				});
			}

			if ((my_team == TEAM.B && match.black_draw == DB_REQUEST_ASK) ||
				(my_team == TEAM.W && match.white_draw == DB_REQUEST_ASK)) {
				$('#draw-btn .btn').attr('disabled', 'disabled');
			}
			else {
				$('#draw-btn .btn').removeAttr('disabled');
			}
		}

		if (match && match.black && match.white && match.white_timer && match.black_timer) {
			let t1 = match_data.updated.toDate();
			let t2 = new Date();
			let diff = t2.getTime() - t1.getTime();
			let sec = Math.floor(diff / 1000);

			if (turn == TEAM.B) {
				white_timer = match.white_timer;
				black_timer = match.black_timer - sec;
			}
			else {
				black_timer = match.black_timer;
				white_timer = match.white_timer - sec;
			}

			let network_delay = 1000 - new Date().getMilliseconds();

			if (network_delay > 270) {
				if (turn == TEAM.B) {
					black_timer --;
				}
				else {
					white_timer --;
				}
			}

			setTimeout(() => {
				clearInterval(interval);
				countDown();
				$('#add-time-btn .btn').removeAttr('disabled');
				interval = setInterval(function() {
					countDown();
				}, 1000);
			}, network_delay);
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
	initToolbar();
	initChat();
}

function showTimer() {
	$('#white-timer').text(Util.formatTimer(white_timer));
	$('#black-timer').text(Util.formatTimer(black_timer));

	if (turn == TEAM.W && white_timer >= 0)
		$('#white-timer').addClass('ticking');
	else
		$('#white-timer').removeClass('ticking');

	if (turn == TEAM.B && black_timer >= 0)
		$('#black-timer').addClass('ticking');
	else
		$('#black-timer').removeClass('ticking');
}

function countDown() {
	showTimer();

	if (turn == TEAM.W && white_timer >= 0) {
		if (white_timer <= 0) {
			Firebase.timesup(match_id, match, TEAM.B);
			clearInterval(interval);
		}
		else {
			white_timer --;
		}
	}

	if (turn == TEAM.B && black_timer >= 0) {
		if (black_timer <= 0) {
			Firebase.timesup(match_id, match, TEAM.W);
			clearInterval(interval);
		}
		else {
			black_timer --;
		}
	}
}


function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		firebase.auth().signOut();
		location.reload();
	});

	$('#home-btn').on('click', (e) => {
		window.location = CHESS_URL + "/";
	});
}


//Set player info
function setTitleBar(auth_user) {

	if (!black_title_set && match.black) {
		Firebase.getUser(match.black, (user_data) => {
			$('#black-player-image').attr('src', user_data.photoURL);
			$('#black-player-name').text(user_data.displayName);
			$('#black-player-utility-image').attr('src', user_data.photoURL);
			$('#black-player-utility-name').text(user_data.displayName);
			black_title_set = true;
			names.black = user_data.displayName;
			pictures.black = user_data.photoURL;

			$('#chat-messages-content').replaceWith($.parseHTML($('#chat-messages-content').prop('outerHTML').replace(/\[B\]/g, names.black)));
			$("#chat-messages-content").scrollTop($("#chat-messages-content")[0].scrollHeight);
		});
	}

	if (!white_title_set && match.white) {
		Firebase.getUser(match.white, (user_data) => {
			$('#white-player-image').attr('src', user_data.photoURL);
			$('#white-player-name').text(user_data.displayName);
			$('#white-player-utility-image').attr('src', user_data.photoURL);
			$('#white-player-utility-name').text(user_data.displayName);
			white_title_set = true;
			names.white = user_data.displayName;
			pictures.white = user_data.photoURL;

			$('#chat-messages-content').replaceWith($.parseHTML($('#chat-messages-content').prop('outerHTML').replace(/\[W\]/g, names.white)));
			$("#chat-messages-content").scrollTop($("#chat-messages-content")[0].scrollHeight);
		});
	}
}

//Intialize chessboard background
function initBoard(){
	for (var x = 0; x < BOARD_SIZE; x++) {
		for (var y = 0; y < BOARD_SIZE; y++) {
			//Grid instance
			chessboard[x][y] = new Grid(x, y, -1, null);

			//Grid Background
			let backgroundGrid = document.createElement("div");
			backgroundGrid.setAttribute("class", "grid x" + x + " y" + y);
			canvasLayer.append(backgroundGrid);
			background[x][y] = backgroundGrid;

			//Grid Listener for onclick event
			let gridListener = document.createElement("div");
			gridListener.setAttribute("class", "grid x" + x + " y" + y);
			gridListener.setAttribute("style", `z-index: 10;`);
			gridListener.setAttribute("onClick", `onClick(event, ${x}, ${y})`);
			gridsLayer.append(gridListener);
		}
	}

	for (var x = 0; x < BOARD_SIZE; x++) {
		for (var y = 0; y < BOARD_SIZE; y++) {
			fillNumbering(x, y);
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

function initChat() {
	$("#side-layer").on('keyup', function (e) {
		if (e.keyCode === 13) {
			let message = $("#chat-text-input").val();
			Firebase.message(match_id, match, message, my_team);
			$("#chat-text-input").val("");
		}
	});
	$("#chat-send-button").on('click', function (e) {
		let message = $("#chat-text-input").val();
		Firebase.message(match_id, match, message, my_team);
		$("#chat-text-input").val("");
	});
}


//Handle all chessboard click events
function onClick(event, x, y) {
	//Handle chess event with (x, y) click coordinate
	handleChessEvent(x, y);
}


//Handle chess event with (x, y) click coordinate
function handleChessEvent(x, y) {
	if ((auth_user.uid != match.black && auth_user.uid != match.white) || my_team != turn)
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

	first_move = false;

	//Action0 - Castle
	if (canCastle(oldGrid, newGrid)) {
		moveChess(oldGrid, newGrid);
		Firebase.updateChessboard(match_id, match, oldGrid, newGrid, turn, black_timer, white_timer);
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

		if (my_team == TEAM.B)
			black_timer += 1
		else
			white_timer += 1

		Firebase.updateChessboard(match_id, match, oldGrid, newGrid, turn, black_timer, white_timer);
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
						return STATUS_NONE;
					}
				}
			}
		}
	}

	if (isKingSafe()) {
		return STATUS_STALEMATE;
	}
	return STATUS_CHECKMATE;
}


//Move chess from oldGrid to newGrid
function moveChess(oldGrid, newGrid) {
	if (oldGrid.get_piece() == null) return;

	//Play sound
	if (!first_move) {
		if (!newGrid.get_piece())
			playSound("doo");
		else if (newGrid.get_piece().team == my_team)
			playSound("uhoh");
		else
			playSound("yay");
	}
	else {
		playSound("opening");
	}

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
			old_img.style.zIndex = "";

			if (newGridTeam == TEAM.B) {
				$('#blacksEaten').append(new_img);
			}
			else {
				$('#whitesEaten').append(new_img);
			}
		}, 300); //TODO: delay depends on the pieces' distance
	}

	movePassantPawn(oldGrid, newGrid);

	//Castle move
	if (my_team == oldGrid.get_piece().team && !king_moved || my_team != oldGrid.get_piece().team && !other_king_moved) {
		if (oldGrid.get_piece().type == CHESS.King && Math.abs(newGrid.x - oldGrid.x) == 2) {
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

	//Other King has moved, cannot castle anymore
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

	//Update king position
	if (oldGrid == king_grid)
		king_grid = newGrid;

	//Clear old grid
	oldGrid.piece = -1;

	//Update move counter and switch turn
	moves_applied += 1;
	switchTurn();
	updateStats();
}


function movePassantPawn(oldGrid, newGrid) {
	let kill_passant_pawn = false;

	// Check passant pawn can be killed
	if (passant_pawn) {
		if (oldGrid.get_piece().team == my_team && passant_pawn.get_piece().team != my_team) {
			if (newGrid.x == passant_pawn.x && newGrid.y == passant_pawn.y - 1) {
				kill_passant_pawn = true;
			}
		}
		else if (oldGrid.get_piece().team != my_team && passant_pawn.get_piece().team == my_team) {
			if (newGrid.x == passant_pawn.x && newGrid.y == passant_pawn.y + 1) {
				kill_passant_pawn = true;
			}
		}
	}

	// Kill passant pawn
	if (kill_passant_pawn && passant_pawn) {
		if (passant_pawn.get_piece().team == TEAM.B)
			stats.black -= VALUE[passant_pawn.get_piece().type];
		else
			stats.white -= VALUE[passant_pawn.get_piece().type];

		let pawn_img = passant_pawn.get_piece().image;
		let pawn_team = passant_pawn.get_piece().team;

		piecesLayer.removeChild(pawn_img);
		pawn_img.setAttribute("class", "eaten-piece");

		if (pawn_team == TEAM.B) {
			$('#blacksEaten').append(pawn_img);
		}
		else {
			$('#whitesEaten').append(pawn_img);
		}
		passant_pawn.piece = -1;
	}

	//Update en passant pawns
	passant_pawn = undefined;
	if (oldGrid.get_piece().type == CHESS.Pawn) {
		if (oldGrid.get_piece().team == my_team) {
			if (oldGrid.y - newGrid.y == 2) {
				passant_pawn = newGrid;
			}
		}
		else {
			if (newGrid.y - oldGrid.y == 2) {
				passant_pawn = newGrid;
			}
		}
	}
}


//Update and show all possible moves based on a specific grid
function updateMoves(grid) {
	moves = grid.get_piece().getPossibleMoves(chessboard, grid);

	//Show left castle move for king
	if (!king_moved && grid == king_grid && canCastle(grid, chessboard[grid.x - 2][grid.y]))
		moves.push(chessboard[grid.x - 2][grid.y]);

	//Show right castle move for king
	if (!king_moved && grid == king_grid && canCastle(grid, chessboard[grid.x + 2][grid.y]))
		moves.push(chessboard[grid.x + 2][grid.y]);

	//Show en passant move for pawn
	if (passant_pawn) {
		if (grid.get_piece().team != passant_pawn.get_piece().team) {
			if (Math.abs(grid.x - passant_pawn.x) == 1 && grid.y == passant_pawn.y) {
				if (grid.get_piece().team == my_team)
					moves.push(chessboard[passant_pawn.x][passant_pawn.y - 1]);
				else
					moves.push(chessboard[passant_pawn.x][passant_pawn.y + 1]);
			}
		}
	}

	setMovesColor(COLOR_HIGHLIGHT);
}


function updateStats() {
	let w_stat = stats.white / (stats.white + stats.black);
	w_stat = 0.35 * Math.atan(10 * w_stat - 5) + 0.5;

	let w_pos = my_team == TEAM.W ? "bottom" : "top";

	$(".canvas-border.bg-white").css("height", `calc(${w_stat} * var(--canvas-size))`);
	$(".canvas-border.bg-white").css(w_pos, '0');

	if (my_team == TEAM.W) {
		$(".canvas-border.bg-white").css('border-radius', '0 0 var(--border-radius) var(--border-radius)');
		$(".canvas-border.bg-black").css('border-radius', 'var(--border-radius) var(--border-radius) var(--border-radius) var(--border-radius)');
	}
	else {
		$(".canvas-border.bg-white").css('border-radius', 'var(--border-radius) var(--border-radius) 0 0');
		$(".canvas-border.bg-black").css('border-radius', 'var(--border-radius) var(--border-radius) var(--border-radius) var(--border-radius)');
	}

	if (stats.white > stats.black) {
		$("#white-stat").text("+" + (stats.white - stats.black));
		$("#black-stat").text("+0");
	}
	else {
		$("#white-stat").text("+0");
		$("#black-stat").text("+" + (stats.black - stats.white));
	}
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

	if (color == COLOR_HIGHLIGHT)
		color = (grid.color == theme.COLOR_BOARD_DARK) ? theme.COLOR_HIGHLIGHT_DARK : theme.COLOR_HIGHLIGHT_LIGHT;

	if (color == COLOR_LAST_MOVE)
		color = (grid.color == theme.COLOR_BOARD_DARK) ? theme.COLOR_LAST_MOVE_DARK : theme.COLOR_LAST_MOVE_LIGHT;

	background[grid.x][grid.y].setAttribute("style", `background-color: ${color};`);
}

//Set numbering for specific grids
function fillNumbering(x, y) {
	let color;

	if (my_team == TEAM.B)
		color = (y % 2 == 0) ? "black" : "white";
	else
		color = (y % 2 != 0) ? "black" : "white";

	if (x == 0) {
		let number = document.createElement("div");
		number.setAttribute("class", `${color} numbering`);
		number.innerText = BOARD_SIZE - y;
		background[x][y].append(number);
	}

	if (my_team == TEAM.W)
		color = (x % 2 == 0) ? "black" : "white";
	else
		color = (x % 2 != 0) ? "black" : "white";

	if (y == BOARD_SIZE - 1) {
		let letter = document.createElement("div");
		letter.setAttribute("class", `${color} lettering`);
		letter.innerText = String.fromCharCode(x + 97);
		background[x][y].append(letter);
	}
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

	let validPieces = getValidPieces(board, target_grid, my_team)
	let enemies = validPieces.enemies;
	let friends = validPieces.friends;

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
		$("#white-player-image").css("border", "calc(var(--picture-size) / 15) solid #008640");
		$("#black-player-image").css("border", "calc(var(--picture-size) / 15) solid #000000");
	}
	else {
		turn = TEAM.B;
		$("#black-player-image").css("border", "calc(var(--picture-size) / 15) solid #008640");
		$("#white-player-image").css("border", "calc(var(--picture-size) / 15) solid #ffffff");
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


function changeTheme(newTheme) {
	theme = newTheme;
	let color1 = my_team == TEAM.W ? theme.COLOR_BOARD_DARK : theme.COLOR_BOARD_LIGHT;
	let color2 = my_team == TEAM.W ? theme.COLOR_BOARD_LIGHT : theme.COLOR_BOARD_DARK;

	for (let x = 0; x < BOARD_SIZE; x++) {
		for (let y = 0; y < BOARD_SIZE; y++) {
			chessboard[x][y].color = (y % 2 != 0) ^ (x % 2 == 0) ? color1 : color2;
			fillGrid(chessboard[x][y], chessboard[x][y].color);
		}
	}

	$('body').css('background-image', `url(${theme.BACKGROUND_IMAGE})`);
	$('.player-name').css('color', theme.NAME_TITLE_COLOR);
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

window.onscroll = function(ev) {
	let offset = 10;
	if (!SCREEN_PORTRAIT && (window.innerHeight + window.scrollY + offset) >= document.body.offsetHeight) {
		$('#chat-notification').attr('hidden', 'hidden');
	}
};

function onInviteClick() {
	if ($('#invite-btn .btn').attr('disabled') == 'disabled')
		return;

	let e = document.createElement('textarea');
	e.value = window.location.href;
	document.body.appendChild(e);
	e.select();
	document.execCommand('copy');
	document.body.removeChild(e);

	swal('Invite Link Copied!', { button: false, timer: 3000 });
}

function onResignClick() {
	if ($('#resign-btn .btn').attr('disabled') == 'disabled')
		return;

	swal({
		text: "Resign match?",
		type: "warning",
		showCancelButton: true,
		buttons: [
		  'Cancel',
		  'Resign'
		],
		closeOnConfirm: false
	}).then((toResign) => {
		if (toResign) {
			Firebase.resign(match_id, match, my_team == TEAM.W ? TEAM.B : TEAM.W);
		}
	});
}

function onDrawClick() {
	if ($('#draw-btn .btn').attr('disabled') == 'disabled')
		return;

	Firebase.askDraw(match_id, match, my_team);
}

function onUndoClick() {
	if ($('#undo-btn .btn').attr('disabled') == 'disabled')
		return;

	Firebase.askUndo(match_id, match, my_team);
}

function onAddTimeClick() {
	if ($('#add-time-btn .btn').attr('disabled') == 'disabled')
		return;

	if (my_team == TEAM.W) {
		black_timer += 16;
		Firebase.updateTimer(match_id, match, match.black_timer + 15, match.white_timer);
	}
	else {
		white_timer += 16;
		Firebase.updateTimer(match_id, match, match.black_timer, match.white_timer + 15);
	}
	showTimer();
	$('#add-time-btn .btn').attr('disabled', 'disabled');
}

function onThemeClick() {
	swal("", { button: false });
	$(".swal-modal").prepend('<div></div>');

	$(".swal-modal div").load('html/theme_selector.html', () => {
		$('.utility-btn').removeClass('outline');
		if (theme == THEME_CLASSIC) $('#classic-theme-btn .btn').addClass('outline');
		else if (theme == THEME_WINTER) $('#winter-theme-btn .btn').addClass('outline');
		else if (theme == THEME_METAL) $('#metal-theme-btn .btn').addClass('outline');
		else if (theme == THEME_NATURE) $('#nature-theme-btn .btn').addClass('outline');
	});
}

function onThemeSelect(event, newTheme) {
	$('.utility-btn').removeClass('outline');
	$(event.target).addClass('outline');
	Firebase.changeTheme(match_id, match, newTheme);
	swal.close();
}
