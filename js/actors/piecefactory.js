class PieceFactory {
	static createPiece(team, type, image) {
		switch (type) {
			case CHESS.King:
				return new King(team, image);
			case CHESS.Queen:
				return new Queen(team, image);
			case CHESS.Rook:
				return new Rook(team, image);
			case CHESS.Bishop:
				return new Bishop(team, image);
			case CHESS.Knight:
				return new Knight(team, image);
			case CHESS.Pawn:
				return new Pawn(team, image);
			default:
				return new None(team, image);
		}
	}
}
