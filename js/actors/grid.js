var pieces = {};

class Grid {
	constructor(x, y, piece) {
		this.x = x;
		this.y = y;
		this.piece = piece;
	}
	get_piece() {
		if (this.piece == -1) return null;
		return pieces[this.piece];
	}
}
