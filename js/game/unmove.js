// Unmove chess piece from newGrid to oldGrid
function unmoveChess() {
	if (moves_stack.length == 0) return;

	passant_stack.pop();
	passant_pawn = passant_stack[passant_stack.length - 1];

	let prev_move = unstackEatenPiece();
	// {
	// 	old_x: oldGrid.x,
	// 	old_y: oldGrid.y,
	// 	new_x: newGrid.x,
	// 	new_y: newGrid.y,
	// 	eaten_x: eatenGrid.x,
	// 	eaten_y: eatenGrid.y,
	// 	eaten_piece: eatenPiece,
	// 	flag: flag
	// }

	let newGrid = chessboard[prev_move.new_x][prev_move.new_y];
	let oldGrid = chessboard[prev_move.old_x][prev_move.old_y];
	let eatenGrid = chessboard[prev_move.eaten_x][prev_move.eaten_y];
	let eaten_piece = prev_move.eaten_piece;
	let flag = prev_move.flag;
	console.log("==================");
	console.log("newGrid: " + JSON.stringify(newGrid));
	console.log("oldGrid: " + JSON.stringify(oldGrid));
	console.log("eaten_grid: " + JSON.stringify(eatenGrid));
	console.log("eaten_piece: " + eaten_piece);

	revertMoveHistory();

	//===================== Special Moves ========================

	//Castle Move
	if (flag == FLAG_KING_CASTLE) {
		unmoveCastleKing(newGrid, oldGrid);
	}

	//====================== Redraw Pieces =======================

	//Copy newGrid piece for oldGrid.
	drawGridPiece(oldGrid, newGrid.piece);

	//====================== Update Miscs =======================

	//Pawn to Queen Move
	if (flag == FLAG_PAWN_TO_QUEEN) {
		unmovePawnToQueen(newGrid, oldGrid, eaten_piece);
	}

	//Update king position
	king_grid = newGrid == king_grid ? oldGrid : king_grid;

	//Clear new grid piece
	newGrid.piece = -1;

	//Restore piece if being eaten
	unmoveEatPiece(eatenGrid, eaten_piece);

	//Update move counter and switch turn
	moves_applied -= 1;

	//Color old and new grids
	// colorLatestMove(newGrid, oldGrid);

	//Switch turn
	switchTurn();

	//Show resulting stats
	updateStats();
}

function unmoveEatPiece(eatenGrid, eaten_piece) {
	if (eaten_piece != -1) {
		stats[pieces[eaten_piece].team] += VALUE[pieces[eaten_piece].type];

		var new_img = pieces[eaten_piece].image;
		var newGridTeam = pieces[eaten_piece].team;

		piecesLayer.appendChild(new_img);
		new_img.setAttribute("class", "piece x" + eatenGrid.x + " y" + eatenGrid.y);
		eatenGrid.piece = eaten_piece;

		if (newGridTeam == TEAM.B) {
			$('#blacksEaten').children().last().remove();
		}
		else {
			$('#whitesEaten').children().last().remove();
		}
	}
}

function unmoveCastleKing(newGrid, oldGrid) {
	// Perform right castle
	if (oldGrid.x - newGrid.x == -2) {
		chessboard[BOARD_SIZE - 1][newGrid.y].piece = chessboard[newGrid.x - 1][newGrid.y].piece;
		chessboard[BOARD_SIZE - 1][newGrid.y].get_piece().image.setAttribute("class", "piece x" + (BOARD_SIZE - 1) + " y" + newGrid.y);
		chessboard[newGrid.x - 1][newGrid.y].piece = -1;
	}

	// Perform left castle
	if (oldGrid.x - newGrid.x == 2) {
		chessboard[0][newGrid.y].piece = chessboard[newGrid.x + 1][newGrid.y].piece;
		console.log(JSON.stringify(chessboard[0][newGrid.y]));
		chessboard[0][newGrid.y].get_piece().image.setAttribute("class", "piece x" + (0) + " y" + newGrid.y);
		chessboard[newGrid.x + 1][newGrid.y].piece = -1;
		console.log(JSON.stringify(chessboard[0][newGrid.y]));
	}

	// Restore king_moved check
	if (newGrid == king_grid) {
		king_moved = false;
	}

	// Restore other_king_moved check
	if (my_team != newGrid.get_piece().team && newGrid.get_piece().type == CHESS.King) {
		other_king_moved = false;
	}
}

function unmovePawnToQueen(newGrid, oldGrid, eaten_piece) {
	oldGrid.piece = newGrid.piece;
	piecesLayer.removeChild(newGrid.get_piece().image);
	initEachPiece(id++, oldGrid.x, oldGrid.y, oldGrid.get_piece().team, CHESS.Pawn);

	stats[oldGrid.get_piece().team] += VALUE[CHESS.Pawn] - VALUE[CHESS.Queen];
}

function unstackEatenPiece() {
	return moves_stack.pop();
}
