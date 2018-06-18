class Util {
	static checkPosition(pos) {
		if (pos != null && this.inBound(pos.x) && this.inBound(pos.y))
			return pos;
		else
			return null;
	}
	static inBound(i) {
		return i >= 0 && i < BOARD_SIZE;
	}
}