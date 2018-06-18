class None extends Piece {

	constructor(team, image) {
		super(team, CHESS.None, VALUE.None, image);
	}

	getPossibleMoves(chessboard, grid) {
		return [];
	}
}
