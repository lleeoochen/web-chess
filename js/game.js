---
---

//Intialize global variables
var canvasLayer = document.getElementById("canvas-layer");
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
var enemy_team = null;
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
	B: STATS_MAX,
	W: STATS_MAX
};

var players = {
	B: null,
	W: null
};

var passant_pawn = null;
var database = new GameFirebase();
var game_reset = true;

var moves_stack = [];
var passant_stack = [];

var timer_enable = false;
var user_id;
var hidden = true;

database.getProfile().then(res => {
	user_id = res.id;
	database.user_id = user_id;

	database.listenMatch(user_id, match_id, async (_match, _my_team) => {
		match = _match;
		my_team = _my_team;
		enemy_team = my_team == TEAM.B ? TEAM.W : TEAM.B;
		console.log(match);

		timer_enable = match.black_timer < MAX_TIME && match.white_timer < MAX_TIME;
		enableHtml('#add-time-btn .utility-btn', timer_enable);

		if (game_reset) {
			initGame();
			if (timer_enable) {
				$('#white-timer').text(Util.formatTimer(match.white_timer));
				$('#black-timer').text(Util.formatTimer(match.black_timer));
			}
			else {
				$('#white-timer').text('∞:∞');
				$('#black-timer').text('∞:∞');
			}
		}

		updateTheme(Util.unpackTheme(match.theme));

		if (hidden) {
			$('#game-content').removeClass('hidden');
			hidden = false;
		}

		await updatePlayerData();

		updateMatchChat();

		updateUtilityButtons();

		if (match.moves.length > 0 && Util.gameFinished(match)) {
			clearInterval(interval);

			showHtml('#invite-panel', false);
			showHtml('#game-panel', false);
			showHtml('#theme-panel', false);
			showHtml('#review-panel', true);
			updateReviewButtons();
			showEnding();
			return false;
		}

		await updateMatchMoves();

		updateMatchUndo();
		
		updateMatchDraw();

		if (match.black && match.white && timer_enable) {
			updateMatchTimer();
		}
	});
});

function updateMatchChat() {
	for (; match.chat.length != chats_applied;) {
		let chat = Util.unpackMessage(match.chat[chats_applied]);
		addChatMessage(chat.message, chat.team);
	}
}

function addChatMessage(message, team) {
	let color = team == TEAM.B ? 'dark' : 'light';
	let photo = players[team].photo;
	let player = players[team].name;

	if (chats_applied != 0 && team == Util.unpackMessage(match.chat[chats_applied - 1]).team) {
		let message_html = $('#chat-messages-content').children().last().find('.chat-message-content');
		message_html.html(message_html.html() + "<br>" + message);
	}
	else {
		$("#chat-messages-content").append(`
			<div class="chat-message ${color} row">
				<div class="chat-message-sender">
					<div>${ player }</div>
				</div>
				<p class="chat-message-content">${ message }</p>
			</div>`);
	}

	$("#chat-messages-content").scrollTop($("#chat-messages-content")[0].scrollHeight);

	let offset = 10;
	if (!SCREEN_PORTRAIT && (window.innerHeight + window.scrollY + offset) < document.body.offsetHeight) {
		showHtml('#chat-notification', true);
	}

	chats_applied++;

	$('.chat-message.dark').css('background-color', theme.COLOR_BOARD_DARK);
	$('.chat-message.dark').css('color', 'white');
	$('.chat-message.light').css('background-color', theme.COLOR_BOARD_LIGHT);
	$('.chat-message.light').css('color', 'black');
}

async function updateMatchMoves() {
	while (moves_applied > match.moves.length) {
		unmoveChess();
	}

	while (moves_applied < match.moves.length) {
		let move = Util.unpack(match.moves[moves_applied], turn != my_team);

		await new Promise((resolve, reject) => {
		  setTimeout(() => {
			moveChess(chessboard[move.old_x][move.old_y], chessboard[move.new_x][move.new_y]);
			resolve();
		  }, 50);
		})
		turn = move.turn == TEAM.W ? TEAM.B : TEAM.W;
	}

	switch(isCheckmate()) {
		case STATUS_CHECKMATE:
			database.checkmate(my_team == TEAM.W ? TEAM.B : TEAM.W);
			playSound("omgwow");
			break;
		case STATUS_STALEMATE:
			database.stalemate();
			break;
	}
}

function updateMatchUndo() {
	if (my_team == TEAM.B && match.white_undo == DB_REQUEST_ASK || my_team == TEAM.W && match.black_undo == DB_REQUEST_ASK) {
		swal({
			text: `${players[enemy_team].name} is asking for your mercy.`,
			buttons: [
			  'Cancel',
			  'Undo Move'
			],
		}).then((toResign) => {
			if (toResign) {
				database.undoMove();
			}
			else {
				database.cancelUndo();
			}
		});
	}

	if (match.moves.length == 0 || turn == my_team ||
		(my_team == TEAM.B && match.black_undo == DB_REQUEST_ASK) ||
		(my_team == TEAM.W && match.white_undo == DB_REQUEST_ASK)) {
		enableHtml('#undo-btn .utility-btn', false);
	}
	else {
		enableHtml('#undo-btn .utility-btn', true);
	}
}

function updateMatchDraw() {
	if (my_team == TEAM.B && match.white_draw == DB_REQUEST_ASK ||
		my_team == TEAM.W && match.black_draw == DB_REQUEST_ASK) {
		swal({
			text: `${players[enemy_team].name} is asking for a draw. Confirm?`,
			buttons: [
			  'Cancel',
			  'Draw'
			],
		}).then((toResign) => {
			if (toResign) {
				database.draw();
			}
			else {
				database.cancelDraw();
			}
		});
	}

	if ((my_team == TEAM.B && match.black_draw == DB_REQUEST_ASK) ||
		(my_team == TEAM.W && match.white_draw == DB_REQUEST_ASK)) {
		enableHtml('#draw-btn .utility-btn', false);
	}
	else {
		enableHtml('#draw-btn .utility-btn', true);
	}
}


function updateMatchTimer() {
	let t1 = new Date(match.updated);
	let t2 = new Date();
	let time_since_last_move = Math.floor((t2.getTime() - t1.getTime()) / 1000);

	if (turn == TEAM.B) {
		white_timer = match.white_timer;
		black_timer = match.black_timer - time_since_last_move;
	}
	else {
		black_timer = match.black_timer;
		white_timer = match.white_timer - time_since_last_move;
	}

	// Many magic numbers.. please fix in the future.
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
		enableHtml('#add-time-btn .utility-btn', true);

		interval = setInterval(function() {
			countDown();
		}, 1000);
	}, network_delay);
}

function updateUtilityButtons() {
	showHtml('#game-utility-title',	true);

	if (match.black && match.white) {
		showHtml('#invite-panel', false);
		showHtml('#game-panel', true);
		showHtml('#theme-panel', true);
		showHtml('#move-history-divider', true);
	}
	else {
		showHtml('#invite-panel', true);
		showHtml('#game-panel', false);
		showHtml('#theme-panel', false);
		showHtml('#move-history-divider', false);
	}
}

function showEnding() {
	let move = match.moves[match.moves.length - 1];

	if (move == DB_STALEMATE) {
		swal('Stalemate.', {button: false });
	}
	else if (move == DB_DRAW) {
		swal('Draw.', {button: false });
	}
	else if (move == DB_CHECKMATE_BLACK) {
		swal('Checkmate. Black Team Wins!', { button: false });
	}
	else if (move == DB_CHECKMATE_WHITE) {
		swal('Checkmate. White Team Wins!', { button: false });
	}
	else if (move == DB_TIMESUP_BLACK) {
		swal('Time\'s Up. Black Team Wins!', { button: false });
	}
	else if (move == DB_TIMESUP_WHITE) {
		swal('Time\'s Up. White Team Wins!', { button: false });
	}
	else if (move == DB_RESIGN_BLACK) {
		swal('White Resigned. Black Team Wins!', { button: false });
	}
	else if (move == DB_RESIGN_WHITE) {
		swal('Black Resigned. White Team Wins!', { button: false });
	}
}

//Game
function initGame() {
	canvasLayer.addEventListener("click", onClick, false);
	$("#W-player-icon").css("background-color", "#008640");
	$('#invite-link').text(window.location.href);

	updateStats();
	initBoard();
	initPieces();
	initToolbar();
	initChat();

	game_reset = false;
}

function showTimer() {
	$('#white-timer').text(Util.formatTimer(white_timer));
	$('#black-timer').text(Util.formatTimer(black_timer));

	$('#white-timer').toggleClass('ticking', turn == TEAM.W && white_timer >= 0);
	$('#black-timer').toggleClass('ticking', turn == TEAM.B && black_timer >= 0);
}

function countDown() {
	showTimer();

	if (turn == TEAM.W) {
		if (white_timer <= 0) {
			database.timesup(TEAM.B);
			clearInterval(interval);
		}
		else {
			white_timer --;
		}
	}

	if (turn == TEAM.B) {
		if (black_timer <= 0) {
			database.timesup(TEAM.W);
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
		database.auth().signOut();
		location.reload();
	});

	$('#home-btn').on('click', (e) => {
		window.location = "{{ site.baseUrl }}/";
	});
}

async function updatePlayerData() {
	if (!players[TEAM.B] && match.black) {
		await database.getUser(match.black).then((user) => {
			players[TEAM.B] = user.data;
			setPlayerHTML(TEAM.B);
		});
	}
	if (!players[TEAM.W] && match.white) {
		await database.getUser(match.white).then((user) => {
			players[TEAM.W] = user.data;
			setPlayerHTML(TEAM.W);
		});
	}
}

//Set player info
function setPlayerHTML(team) {
	let player = players[team];
	let regex = team == TEAM.B ? /\[B\]/g : /\[W\]/g;

	$(`#${team}-player-image`).attr('src', player.photo);
	$(`#${team}-player-name`).text(player.name);
	$(`#${team}-player-utility-image`).attr('src', player.photo);
	$(`#${team}-player-utility-name`).text(player.name);

	$('#chat-messages-content').replaceWith($.parseHTML($('#chat-messages-content').prop('outerHTML').replace(regex, player.name)));
	$("#chat-messages-content").scrollTop($("#chat-messages-content")[0].scrollHeight);
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

	let king_x = my_team == TEAM.B ? 3 : 4;
	let queen_x = my_team == TEAM.B ? 4 : 3;

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

	initEachPiece(id++, queen_x, black_pos, TEAM.B, CHESS.Queen);
	initEachPiece(id++, king_x, black_pos, TEAM.B, CHESS.King);

	initEachPiece(id++, 0, white_pos, TEAM.W, CHESS.Rook);
	initEachPiece(id++, 7, white_pos, TEAM.W, CHESS.Rook);
	initEachPiece(id++, 1, white_pos, TEAM.W, CHESS.Knight);
	initEachPiece(id++, 6, white_pos, TEAM.W, CHESS.Knight);
	initEachPiece(id++, 2, white_pos, TEAM.W, CHESS.Bishop);
	initEachPiece(id++, 5, white_pos, TEAM.W, CHESS.Bishop);

	initEachPiece(id++, queen_x, white_pos, TEAM.W, CHESS.Queen);
	initEachPiece(id++, king_x, white_pos, TEAM.W, CHESS.King);

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
			addChatMessage(message, my_team);
			database.message(message);
			$("#chat-text-input").val("");
		}
	});
	$("#chat-send-button").on('click', function (e) {
		let message = $("#chat-text-input").val();
		addChatMessage(message, my_team);
		database.message(message);
		$("#chat-text-input").val("");
	});
}


//Handle all chessboard click events
function onClick(event, x, y) {
	//Handle chess event with (x, y) click coordinate
	handleChessEvent(x, y);
}


//Handle chess event with (x, y) click coordinate
async function handleChessEvent(x, y) {
	if ((user_id != match.black && user_id != match.white) || my_team != turn || Util.gameFinished(match))
		return;

	//Initalize important variables
	let newGrid = chessboard[x][y];
	let isLegal = isLegalMove(newGrid);
	isLegal = isLegal && isKingSafe(oldGrid, newGrid);

	first_move = false;

	//Action0 - Castle
	if (canCastle(oldGrid, newGrid)) {
		database.updateChessboard(oldGrid, newGrid, turn, black_timer, white_timer).catch(err => {
			fillGrid(oldGrid, COLOR_ORIGINAL);
			unmoveChess();
			clearMoves();
			oldGrid = null;
		});

		moveChess(oldGrid, newGrid);
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
		database.updateChessboard(oldGrid, newGrid, turn, black_timer, white_timer).catch(err => {
			fillGrid(oldGrid, COLOR_ORIGINAL);
			unmoveChess();
			clearMoves();
			oldGrid = null;
		});

		moveChess(oldGrid, newGrid);
		if (my_team == TEAM.B)
			black_timer += 1
		else
			white_timer += 1
		oldGrid = null;
	}
}


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
	let w_stat = stats.W / (stats.W + stats.B);
	w_stat = 0.35 * Math.atan(10 * w_stat - 5) + 0.5;

	let w_pos = my_team == TEAM.W ? "bottom" : "top";

	showHtml('.canvas-border', true);
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

	if (stats.W > stats.B) {
		$("#white-stat").text("+" + (stats.W - stats.B));
		$("#black-stat").text("+0");
	}
	else {
		$("#white-stat").text("+0");
		$("#black-stat").text("+" + (stats.B - stats.W));
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
	let numbering = getNumbering(x, y);

	let color = (y % 2 == 0) ? "black" : "white";

	if (x == 0) {
		let number = document.createElement("div");
		number.setAttribute("class", `${color} numbering`);
		number.innerText = numbering.x;
		background[x][y].append(number);
	}

	color = (x % 2 != 0) ? "black" : "white";

	if (y == BOARD_SIZE - 1) {
		let letter = document.createElement("div");
		letter.setAttribute("class", `${color} lettering`);
		letter.innerText = numbering.y;
		background[x][y].append(letter);
	}
}

//Get numbering from grid
function getNumbering(x, y) {
	return {
		x: (my_team == TEAM.B) ? y + 1 : BOARD_SIZE - y,
		y: (my_team == TEAM.B) ? String.fromCharCode(97 + 7 - x) : String.fromCharCode(x + 97)
	}
}

//Set last move grid color
function colorLatestMove(oldGrid, newGrid) {
	clearMoves();

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
		// $("#W-player-image").css("border-color", "#008640");
		// $("#B-player-image").css("border-color", "#000000");
	}
	else {
		turn = TEAM.B;
		// $("#B-player-image").css("border-color", "#008640");
		// $("#W-player-image").css("border-color", "#ffffff");
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


function updateTheme(newTheme) {
	theme = newTheme;

	for (let x = 0; x < BOARD_SIZE; x++) {
		for (let y = 0; y < BOARD_SIZE; y++) {
			chessboard[x][y].color = getGridColor(x, y);
			fillGrid(chessboard[x][y], chessboard[x][y].color);
		}
	}

	// $('.background-image')				.attr('src', `${theme.BACKGROUND_IMAGE}`);
	$('body')							.css('background-image', `url(${theme.BACKGROUND_IMAGE})`);
	$('.player-name')					.css('color',            theme.NAME_TITLE_COLOR);
	$('#canvas-background')				.css('background-color', theme.COLOR_BOARD_LIGHT);
	$('.utility-btn-wrap .utility-btn')	.css('background-color', theme.COLOR_BOARD_DARK);
	$('#chat-send-button')				.css('background-color', theme.COLOR_BOARD_DARK);
	$('.player-pic')					.css('background-color', theme.COLOR_BOARD_DARK);
	$('.player-utility-pic')			.css('background-color', theme.COLOR_BOARD_DARK);
	$(':root')							.css('--dark-color',     theme.COLOR_BOARD_DARK);
	$(':root')							.css('--light-color',    theme.COLOR_BOARD_LIGHT);
	
	$('.chat-message.dark').css('background-color', theme.COLOR_BOARD_DARK);
	$('.chat-message.dark').css('color', 'white');
	$('.chat-message.light').css('background-color', theme.COLOR_BOARD_LIGHT);
	$('.chat-message.light').css('color', 'black');
	// $('.utility-piece-icon.dark')		.css('background-color', theme.COLOR_BOARD_DARK);
	// $('.utility-piece-icon.light')		.css('background-color', theme.COLOR_BOARD_LIGHT);
}

function getGridColor(x, y) {
	return (y % 2 != 0) ^ (x % 2 == 0) ? theme.COLOR_BOARD_LIGHT : theme.COLOR_BOARD_DARK;
}

function drawGridPiece(grid, piece) {
	grid.piece = piece;

	if (grid.get_piece())
		grid.get_piece().image.setAttribute("class", "piece x" + grid.x + " y" + grid.y);
}

function addMoveHistory(oldGrid, newGrid) {
	let old_img = oldGrid.get_piece() ? oldGrid.get_piece().image.src : 'assets/transparent.png';
	let new_img = newGrid.get_piece() ? newGrid.get_piece().image.src : 'assets/transparent.png';

	let old_numbering = getNumbering(oldGrid.x, oldGrid.y);
	let new_numbering = getNumbering(newGrid.x, newGrid.y);

	// let old_color = getGridColor(oldGrid.x, oldGrid.y);
	// let new_color = getGridColor(newGrid.x, newGrid.y);

	let old_color = 'transparent';
	let new_color = 'transparent';

	let old_color_id = old_color == theme.COLOR_BOARD_DARK ? 'dark' : 'light';
	let new_color_id = new_color == theme.COLOR_BOARD_DARK ? 'dark' : 'light';

	$('#move-history-panel').append(`
		<div class="move-history-item utility-btn-wrap">
			<div class="utility-btn">
				<img class="utility-icon utility-piece-icon ${old_color_id}" src="${old_img}" style="background-color: ${old_color}"/>
				(${ old_numbering.y }, ${ old_numbering.x })
				<img class="utility-icon" src="assets/arrow-right.png"/>
				(${ new_numbering.y }, ${ new_numbering.x })
				<img class="utility-icon utility-piece-icon ${new_color_id}" src="${new_img}" style="background-color: ${new_color}"/>
			</div>
		</div>
	`);
	$("#move-history-panel").scrollTop($("#move-history-panel")[0].scrollHeight);
}

function revertMoveHistory() {
	$('.move-history-item').last().remove();
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
		showHtml('#chat-notification', false);
	}
};

function onInviteClick() {
	if (!htmlEnabled('#invite-btn .utility-btn'))
		return;

	let e = document.createElement('textarea');
	e.value = window.location.href;
	document.body.appendChild(e);
	e.select();
	document.execCommand('copy');
	document.body.removeChild(e);

	$('#invite-modal').modal('show');

	// Magic that allows mobile device to select link on 1 click
	selectText('invite-link');
}

function onResignClick() {
	if (!htmlEnabled('#resign-btn .utility-btn'))
		return;

	swal({
		text: "Resign match?",
		animation: false,
		buttons: [
		  'Cancel',
		  'Resign'
		],
	}).then((toResign) => {
		if (toResign) {
			database.resign(my_team == TEAM.W ? TEAM.B : TEAM.W);
		}
	});
}

function onDrawClick() {
	if (!htmlEnabled('#draw-btn .utility-btn'))
		return;

	database.askDraw();
}

function onUndoClick() {
	if (!htmlEnabled('#undo-btn .utility-btn'))
		return;

	database.askUndo();
}

function onAddTimeClick() {
	if (!htmlEnabled('#add-time-btn .utility-btn'))
		return;

	if (my_team == TEAM.W) {
		black_timer += 16;
		database.updateTimer(match.black_timer + 15, match.white_timer);
	}
	else {
		white_timer += 16;
		database.updateTimer(match.black_timer, match.white_timer + 15);
	}

	showTimer();
	enableHtml('#add-time-btn .utility-btn', false);
}

function onThemeClick() {
	$('#theme-modal').modal('show');

	$('#theme-modal .utility-btn').removeClass('outline');
	if (theme == THEME_CLASSIC) $('#classic-theme-btn .utility-btn').addClass('outline');
	else if (theme == THEME_WINTER) $('#winter-theme-btn .utility-btn').addClass('outline');
	else if (theme == THEME_METAL) $('#metal-theme-btn .utility-btn').addClass('outline');
	else if (theme == THEME_NATURE) $('#nature-theme-btn .utility-btn').addClass('outline');
}

function onThemeSelect(event, newTheme) {
	updateTheme(newTheme);
	database.changeTheme(newTheme);
	$('#theme-modal').modal('hide');
}


function showHtml(button, toShow) {
	$(button).toggleClass('hidden', !toShow);
}

function enableHtml(button, toEnable) {
	if (toEnable) {
		$(button).removeAttr('disabled');		
	}
	else {
		$(button).attr('disabled', 'disabled');
	}
}

function htmlEnabled(button) {
	return $(button).attr('disabled') != 'disabled';
}

function selectText(containerid) {
    if (document.selection) { // IE
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select();
    }
    else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}
