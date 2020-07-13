//Move chess from oldGrid to newGrid
function moveChess(oldGrid, newGrid) {
	if (oldGrid.get_piece() == null) return false;

	addMoveHistory(oldGrid, newGrid);

	//Play sound
	moveSound(newGrid);

	stackEatenPiece(oldGrid, newGrid, newGrid, newGrid.piece, false, FLAG_NONE);

	//===================== Special Moves ========================

	//Passant Move
	movePassantPawn(oldGrid, newGrid);

	//Castle Move
	moveCastleKing(oldGrid, newGrid);

	//====================== Redraw Pieces =======================

	//Remove newGrid piece if being eaten
	moveEatPiece(oldGrid, newGrid);

	//Copy oldGrid piece for newGrid.
	drawGridPiece(newGrid, oldGrid.piece);

	//====================== Update Miscs =======================

	//Pawn to Queen Move
	movePawnToQueen(oldGrid, newGrid);

	//Update king position
	king_grid = oldGrid == king_grid ? newGrid : king_grid;

	//Clear old grid piece
	oldGrid.piece = -1;

	//Update move counter and switch turn
	moves_applied += 1;

	//Color old and new grids
	colorLatestMove(oldGrid, newGrid);

	//Switch turn
	switchTurn();

	//Show resulting stats
	updateStats();

	return true;
}

function moveSound(newGrid) {
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
}

function moveEatPiece(oldGrid, newGrid) {
	if (newGrid.get_piece() != null) {
		stats[newGrid.get_piece().team] -= VALUE[newGrid.get_piece().type];

		var old_img = oldGrid.get_piece().image
		var new_img = newGrid.get_piece().image;
		var newGridTeam = newGrid.get_piece().team;

		old_img.style.zIndex = "1000";

		//Eating animation delay.
		setTimeout(() => {
			piecesLayer.removeChild(new_img);
			new_img.setAttribute("class", "eaten-piece");
			old_img.style.zIndex = "";

			if (newGridTeam == my_team) {
				$('#enemy-eaten').append(new_img);
			}
			else {
				$('#me-eaten').append(new_img);
			}
		}, 300); //TODO: delay depends on the pieces' distance
	}
}

function movePassantPawn(oldGrid, newGrid) {
	let kill_passant_pawn = false;

	// Check passant pawn can be killed
	if (passant_pawn && oldGrid.get_piece().type == CHESS.Pawn) {
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
		stats[passant_pawn.get_piece().team] -= VALUE[passant_pawn.get_piece().type];

		stackEatenPiece(oldGrid, newGrid, passant_pawn, passant_pawn.piece, true, FLAG_PASSANT_PAWN);

		let pawn_img = passant_pawn.get_piece().image;
		let pawn_team = passant_pawn.get_piece().team;

		piecesLayer.removeChild(pawn_img);
		pawn_img.setAttribute("class", "eaten-piece");

		if (pawn_team == my_team) {
			$('#enemy-eaten').append(pawn_img);
		}
		else {
			$('#me-eaten').append(pawn_img);
		}

		passant_pawn.piece = -1;
	}

	// Update passant pawns on 2 moves
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
	passant_stack.push(passant_pawn);
}

function moveCastleKing(oldGrid, newGrid) {
	// If oldGrid is king
	if (oldGrid.get_piece().type == CHESS.King) {

		// If either king hasn't move
		if (my_team == oldGrid.get_piece().team && !king_moved || my_team != oldGrid.get_piece().team && !other_king_moved) {

			// Perform right castle
			if (newGrid.x - oldGrid.x == 2) {
				chessboard[oldGrid.x + 1][oldGrid.y].piece = chessboard[BOARD_SIZE - 1][oldGrid.y].piece;
				chessboard[oldGrid.x + 1][oldGrid.y].get_piece().image.setAttribute("class", "piece x" + (oldGrid.x + 1) + " y" + oldGrid.y);
				chessboard[BOARD_SIZE - 1][oldGrid.y].piece = -1;
				stackEatenPiece(oldGrid, newGrid, newGrid, newGrid.piece, true, FLAG_KING_CASTLE);
			}

			// Perform left castle
			if (newGrid.x - oldGrid.x == -2) {
				chessboard[oldGrid.x - 1][oldGrid.y].piece = chessboard[0][oldGrid.y].piece;
				chessboard[oldGrid.x - 1][oldGrid.y].get_piece().image.setAttribute("class", "piece x" + (oldGrid.x - 1) + " y" + oldGrid.y);
				chessboard[0][oldGrid.y].piece = -1;
				stackEatenPiece(oldGrid, newGrid, newGrid, newGrid.piece, true, FLAG_KING_CASTLE);
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
}

function movePawnToQueen(oldGrid, newGrid) {
	if (newGrid.get_piece().type == CHESS.Pawn) {
		let myPawnArrived = newGrid.get_piece().team == my_team && newGrid.y == 0;
		let enemyPawnArrived = newGrid.get_piece().team != my_team && newGrid.y == BOARD_SIZE - 1;

		if (myPawnArrived || enemyPawnArrived) {
			let eatenPiece = moves_stack.pop().eaten_piece;
			stackEatenPiece(oldGrid, newGrid, newGrid, eatenPiece, false, FLAG_PAWN_TO_QUEEN);

			piecesLayer.removeChild(newGrid.get_piece().image);
			initEachPiece(id++, newGrid.x, newGrid.y, newGrid.get_piece().team, CHESS.Queen);

			stats[newGrid.get_piece().team] += VALUE[CHESS.Queen] - VALUE[CHESS.Pawn];
		}
	}
}

function stackEatenPiece(oldGrid, newGrid, eatenGrid, eatenPiece, toPopOne, flag) {
	if (toPopOne) moves_stack.pop();
	moves_stack.push({
		old_x: oldGrid.x,
		old_y: oldGrid.y,
		new_x: newGrid.x,
		new_y: newGrid.y,
		eaten_x: eatenGrid.x,
		eaten_y: eatenGrid.y,
		eaten_piece: eatenPiece,
		flag: flag
	});
}
