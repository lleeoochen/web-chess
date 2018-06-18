class Knight extends Piece {

	constructor(team, image) {
		super(team, CHESS.Knight, VALUE.Knight, image);
	}

	getPossibleMoves(chessboard, grid) {
		let moves = [];
		let possibleWays = [];

		if (grid.piece == null)
			return moves;

		possibleWays.push({x:grid.x + 2, y:grid.y + 1});
		possibleWays.push({x:grid.x + 2, y:grid.y - 1});
		possibleWays.push({x:grid.x - 2, y:grid.y + 1});
		possibleWays.push({x:grid.x - 2, y:grid.y - 1});
		possibleWays.push({x:grid.x + 1, y:grid.y + 2});
		possibleWays.push({x:grid.x + 1, y:grid.y - 2});
		possibleWays.push({x:grid.x - 1, y:grid.y + 2});
		possibleWays.push({x:grid.x - 1, y:grid.y - 2});

		for (let j = 0; j < possibleWays.length; j++) {

			let move = this.checkPosition(possibleWays[j]);
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
