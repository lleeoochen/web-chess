//Return array of moveable coordinates
function getPossibleMoves(chessboard, grid) {
	var moves = [];
	let possibleWays = [];

	if (grid.piece == null)
		return moves;

	moves.push({x:grid.x, y:grid.y});
	switch(grid.piece.type) {

		case CHESS.Bishop:
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});

			for (let i = 1; i < BOARD_SIZE; i++) {

				for (let j = 0; j < possibleWays.length; j++) {

					if (possibleWays[j] != null) {
						switch(j) {
							case 0:
								possibleWays[j].x++;
								possibleWays[j].y++;
								break;
							case 1:
								possibleWays[j].x++;
								possibleWays[j].y--;
								break;
							case 2:
								possibleWays[j].x--;
								possibleWays[j].y++;
								break;
							case 3:
								possibleWays[j].x--;
								possibleWays[j].y--;
								break;
						}
					}

					let move = checkPosition(possibleWays[j]);
					if (move != null) {

						let target = chessboard[move.x][move.y];
						if (target.piece == null)
							moves.push(Object.assign({}, move));

						else {
							if (target.piece.team != grid.piece.team)
								moves.push(Object.assign({}, move));
							possibleWays[j] = null;
						}
					}
				}

			}
			break;

		case CHESS.King:
			possibleWays.push({x:grid.x + 1, y:grid.y});
			possibleWays.push({x:grid.x - 1, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y + 1});
			possibleWays.push({x:grid.x, y:grid.y - 1});
			possibleWays.push({x:grid.x + 1, y:grid.y + 1});
			possibleWays.push({x:grid.x + 1, y:grid.y - 1});
			possibleWays.push({x:grid.x - 1, y:grid.y + 1});
			possibleWays.push({x:grid.x - 1, y:grid.y - 1});

			for (let j = 0; j < possibleWays.length; j++) {

				let move = checkPosition(possibleWays[j]);
				if (move != null) {

					let target = chessboard[move.x][move.y];
					if (target.piece == null)
						moves.push(Object.assign({}, move));

					else {
						if (target.piece.team != grid.piece.team)
							moves.push(Object.assign({}, move));
						possibleWays[j] = null;
					}
				}
			}
			break;

		case CHESS.Knight:
			possibleWays.push({x:grid.x + 2, y:grid.y + 1});
			possibleWays.push({x:grid.x + 2, y:grid.y - 1});
			possibleWays.push({x:grid.x - 2, y:grid.y + 1});
			possibleWays.push({x:grid.x - 2, y:grid.y - 1});
			possibleWays.push({x:grid.x + 1, y:grid.y + 2});
			possibleWays.push({x:grid.x + 1, y:grid.y - 2});
			possibleWays.push({x:grid.x - 1, y:grid.y + 2});
			possibleWays.push({x:grid.x - 1, y:grid.y - 2});

			for (let j = 0; j < possibleWays.length; j++) {

				let move = checkPosition(possibleWays[j]);
				if (move != null) {

					let target = chessboard[move.x][move.y];
					if (target.piece == null)
						moves.push(Object.assign({}, move));

					else {
						if (target.piece.team != grid.piece.team)
							moves.push(Object.assign({}, move));
						possibleWays[j] = null;
					}
				}
			}
			break;

		case CHESS.Pawn:
			let dir = (grid.piece.team == TEAM.W)? -1 : 1;

			if (grid.y == 1 || grid.y == 6)
				possibleWays.push({x:grid.x, y:grid.y + dir * 2});

			if (inBound(grid.y + dir) && inBound(grid.x + 1) && chessboard[grid.x + 1][grid.y + dir].piece != null)
				possibleWays.push({x:grid.x + 1, y:grid.y + dir});

			if (inBound(grid.y + dir) && inBound(grid.x - 1) && chessboard[grid.x - 1][grid.y + dir].piece != null)
				possibleWays.push({x:grid.x - 1, y:grid.y + dir});

			if (inBound(grid.y + dir) && inBound(grid.x) && chessboard[grid.x][grid.y + dir].piece == null)
				possibleWays.push({x:grid.x, y:grid.y + dir});

			for (let j = 0; j < possibleWays.length; j++) {

				let move = checkPosition(possibleWays[j]);
				if (move != null) {

					let target = chessboard[move.x][move.y];
					if (target.piece == null)
						moves.push(Object.assign({}, move));

					else {
						if (target.piece.team != grid.piece.team)
							moves.push(Object.assign({}, move));
						possibleWays[j] = null;
					}
				}
			}
			break;

		case CHESS.Queen:
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});

			for (let i = 1; i < BOARD_SIZE; i++) {

				for (let j = 0; j < possibleWays.length; j++) {

					if (possibleWays[j] != null) {
						switch(j) {
							case 0:
								possibleWays[j].x++;
								possibleWays[j].y++;
								break;
							case 1:
								possibleWays[j].x++;
								possibleWays[j].y--;
								break;
							case 2:
								possibleWays[j].x--;
								possibleWays[j].y++;
								break;
							case 3:
								possibleWays[j].x--;
								possibleWays[j].y--;
								break;
							case 4:
								possibleWays[j].x++;
								possibleWays[j].y;
								break;
							case 5:
								possibleWays[j].x--;
								possibleWays[j].y;
								break;
							case 6:
								possibleWays[j].x;
								possibleWays[j].y++;
								break;
							case 7:
								possibleWays[j].x;
								possibleWays[j].y--;
								break;
						}
					}

					let move = checkPosition(possibleWays[j]);
					if (move != null) {

						let target = chessboard[move.x][move.y];
						if (target.piece == null)
							moves.push(Object.assign({}, move));

						else {
							if (target.piece.team != grid.piece.team)
								moves.push(Object.assign({}, move));
							possibleWays[j] = null;
						}
					}
				}

			}
			break;

		case CHESS.Rook:
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});
			possibleWays.push({x:grid.x, y:grid.y});

			for (let i = 1; i < BOARD_SIZE; i++) {

				for (let j = 0; j < possibleWays.length; j++) {

					if (possibleWays[j] != null) {
						switch(j) {
							case 0:
								possibleWays[j].x++;
								possibleWays[j].y;
								break;
							case 1:
								possibleWays[j].x--;
								possibleWays[j].y;
								break;
							case 2:
								possibleWays[j].x;
								possibleWays[j].y++;
								break;
							case 3:
								possibleWays[j].x;
								possibleWays[j].y--;
								break;
						}
					}

					let move = checkPosition(possibleWays[j]);
					if (move != null) {

						let target = chessboard[move.x][move.y];
						if (target.piece == null)
							moves.push(Object.assign({}, move));

						else {
							if (target.piece.team != grid.piece.team)
								moves.push(Object.assign({}, move));
							possibleWays[j] = null;
						}
					}
				}

			}
			break;

	}

	return moves;
}

function checkPosition(pos) {
	if (pos != null && inBound(pos.x) && inBound(pos.y))
		return pos;
	else
		return null;
}

function inBound(i) {
	return i >= 0 && i < BOARD_SIZE;
}