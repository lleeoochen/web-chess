class Pawn extends Piece {

	constructor(team, image) {
		super(team, CHESS.Pawn, VALUE.Pawn, image);
	}

	getPossibleMoves(chessboard, grid) {
		let moves = [];
		let possibleWays = [];

		if (grid.piece == null)
			return moves;

		let dir = (grid.piece.team == TEAM.W)? -1 : 1;

		if ((grid.y == 1 && dir == 1 || grid.y == 6 && dir == -1)
			&& chessboard[grid.x][grid.y + dir].piece == null
			&& chessboard[grid.x][grid.y + dir * 2].piece == null)
			possibleWays.push({x:grid.x, y:grid.y + dir * 2});

		if (Util.inBound(grid.y + dir) && Util.inBound(grid.x + 1) && chessboard[grid.x + 1][grid.y + dir].piece != null)
			possibleWays.push({x:grid.x + 1, y:grid.y + dir});

		if (Util.inBound(grid.y + dir) && Util.inBound(grid.x - 1) && chessboard[grid.x - 1][grid.y + dir].piece != null)
			possibleWays.push({x:grid.x - 1, y:grid.y + dir});

		if (Util.inBound(grid.y + dir) && Util.inBound(grid.x) && chessboard[grid.x][grid.y + dir].piece == null)
			possibleWays.push({x:grid.x, y:grid.y + dir});

		for (let j = 0; j < possibleWays.length; j++) {

			let move = Util.checkPosition(possibleWays[j]);
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

		return moves;
	}
}
