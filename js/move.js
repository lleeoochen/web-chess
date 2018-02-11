//Return array of moveable coordinates
function getPossibleMoves(grid) {
	let moves = [];

	if (grid.piece == null)
		return moves;

	moves.push({x:grid.x, y:grid.y});
	switch(grid.piece.type) {
		case CHESS.Bishop:
			let x, y;
			for (let i = 1; i < BOARD_SIZE; i++) {
				let moveSW = getEachBishopMove(grid.x + i, grid.y + i);
				let moveSE = getEachBishopMove(grid.x - i, grid.y + i);
				let moveNW = getEachBishopMove(grid.x + i, grid.y - i);
				let moveNE = getEachBishopMove(grid.x - i, grid.y - i);
				if (moveSW != null) moves.push(moveSW);
				if (moveSE != null) moves.push(moveSE);
				if (moveNW != null) moves.push(moveNW);
				if (moveNE != null) moves.push(moveNE);
			}
		break;
			case CHESS.King:
		break;
			case CHESS.Knight:
		break;
			case CHESS.Pawn:
		break;
			case CHESS.Queen:
		break;
			case CHESS.Rook:
		break;
	}
	return moves;
}

function getEachBishopMove(x, y) {
	if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE)
		return {x:x, y:y};
	else
		return null;
}