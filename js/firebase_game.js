---
---

class GameFirebase extends Firebase {
	// match = null;
	// match_id = null;
	// my_team = null;

	constructor() {
		super();
		this.match = null;
		this.my_team = null;
		this.match_id = null;
	}

	listenMatch(user_id, match_id, resolve) {
		this.match_id = match_id;

		super.listenMatch(match_id, (match) => {
			this.match = match.data;

			// Register second user if not exists
			if (!this.match.white && user_id != this.match.black) {
				this.registerOpponent(user_id);
				this.my_team = TEAM.W;
			}
			else if (user_id == this.match.black) {
				this.my_team = TEAM.B;
			}
			else if (user_id == this.match.white) {
				this.my_team = TEAM.W;
			}
			else {
				this.my_team = TEAM.B; // spectate mode
			}

			resolve(this.match, this.my_team);
		});
	}

	updateChessboard(oldGrid, newGrid, turn, black_timer, white_timer) {
		return Util.request('POST', '/chess/match/update_chessboard', {
			match_id: this.match_id,
			move: Util.pack(oldGrid, newGrid, turn),
			black_timer: black_timer,
			white_timer: white_timer,
		});
	}

	updateTimer(black_timer, white_timer) {
		Util.request('POST', '/chess/match/update_timer', {
			match_id: this.match_id,
			black_timer: black_timer,
			white_timer: white_timer,
			message: Util.packMessage(`[Added 15 seconds to opponent.]`, this.my_team)
		});
	}

	checkmate(winning_team) {
		Util.request('POST', '/chess/match/checkmate', {
			match_id: this.match_id,
			winner: winning_team
		});
	}

	stalemate() {
		Util.request('POST', '/chess/match/stalemate', {
			match_id: this.match_id
		});
	}

	draw() {
		Util.request('POST', '/chess/match/draw', {
			match_id: this.match_id,
			message: Util.packMessage(`[Accepted a draw.]`, this.my_team)
		});
	}

	timesup(winning_team) {
		Util.request('POST', '/chess/match/timesup', {
			match_id: this.match_id,
			winner: winning_team,
			message: Util.packMessage(`[Time's up. Match ended.]`, this.my_team)
		});
	}

	resign(winning_team) {
		Util.request('POST', '/chess/match/resign', {
			match_id: this.match_id,
			winner: winning_team,
			message: Util.packMessage(`[Resigned match.]`, this.my_team)
		});
	}

	undoMove() {
		Util.request('POST', '/chess/match/undo', {
			match_id: this.match_id,
			undo_team: this.my_team == TEAM.B ? TEAM.W : TEAM.B,
			message: Util.packMessage(`[Gave mercy to opponent's move.]`, this.my_team)
		});
	}

	cancelUndo() {
		Util.request('POST', '/chess/match/cancel_undo', {
			match_id: this.match_id,
			undo_team: this.my_team == TEAM.B ? TEAM.W : TEAM.B,
		});
	}

	cancelDraw() {
		Util.request('POST', '/chess/match/cancel_draw', {
			match_id: this.match_id,
			draw_team: this.my_team == TEAM.B ? TEAM.W : TEAM.B,
		});
	}

	registerOpponent(user_id) {
		Util.request('POST', '/chess/match/register_opponent', {
			match_id: this.match_id,
			white: user_id,
		});
	}

	message(message) {
		Util.request('POST', '/chess/match/message', {
			match_id: this.match_id,
			message: Util.packMessage(message, this.my_team),
		});
	}

	changeTheme(theme) {
		Util.request('POST', '/chess/match/change_theme', {
			match_id: this.match_id,
			theme: Util.packTheme(theme),
		});
	}

	askUndo() {
		Util.request('POST', '/chess/match/ask_undo', {
			match_id: this.match_id,
			undo_team: this.my_team,
		});
	}

	askDraw() {
		Util.request('POST', '/chess/match/ask_draw', {
			match_id: this.match_id,
			draw_team: this.my_team,
		});
	}
}
