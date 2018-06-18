class Piece {
	constructor(team, type, value, image) {
		if (new.target == Piece)
			throw new TypeError("Piece is an abstract class. It cannot be instantiated.");
		
		if (this.getPossibleMoves === undefined)
			throw new TypeError("Must override function getPossibleMoves().");

		this.team = team;
		this.type = type;
		this.value = value;
		this.image = image;
	}

	checkPosition(pos) {
		if (pos != null && this.inBound(pos.x) && this.inBound(pos.y))
			return pos;
		else
			return null;
	}

	inBound(i) {
		return i >= 0 && i < BOARD_SIZE;
	}
}
