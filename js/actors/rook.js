class Rook extends Piece {

	constructor(team, image) {
		super(team, CHESS.Rook, VALUE.Rook, image);
	}

	getPossibleMoves(chessboard, grid) {
		let moves = [];
		let possibleWays = [];

		if (grid.get_piece() == null)
			return moves;

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

				let move = Util.checkPosition(possibleWays[j]);
				if (move != null) {

					let target = chessboard[move.x][move.y];
					if (target.get_piece() == null)
						moves.push(Object.assign({}, move));

					else {
						if (target.get_piece().team != grid.get_piece().team)
							moves.push(Object.assign({}, move));
						possibleWays[j] = null;
					}
				}
			}
		}

		return moves;
	}
}
