class GameFirebase extends Firebase {
	// match = null;
	// match_id = null;
	// my_team = null;

	listenMatch(match_id, callback) {
		this.match = null;
		this.my_team = null;
		this.match_id = match_id;

		var self = this;

		super.listenMatch(match_id, (match) => {
			self.match = match;

			// Register second user if not exists
			if (!match.white && self.auth_user.uid != match.black) {
				self.registerOpponent(self.auth_user.uid);
				self.my_team = TEAM.W;
			}
			else if (self.auth_user.uid == match.black) {
				self.my_team = TEAM.B;
			}
			else if (self.auth_user.uid == match.white) {
				self.my_team = TEAM.W;
			}
			else {
				self.my_team = TEAM.B; // spectate mode
			}

			callback(self.match, self.my_team);
		});
	}

	updateChessboard(oldGrid, newGrid, turn, black_timer, white_timer) {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(Util.pack(oldGrid, newGrid, turn));

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date(),
			black_timer: black_timer,
			white_timer: white_timer,
		}, { merge: true });
	}

	updateTimer(black_timer, white_timer) {
		this.message(`[Added 15 seconds to opponent.]`);
		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			black_timer: black_timer,
			white_timer: white_timer,
		}, { merge: true });
	}

	addTime(time) {
		let t = this.match.updated.toDate();
		t.setSeconds(t.getSeconds() + time);

		// this.match.chat.push(Util.packMessage(, this.my_team));

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			updated: t
		}, { merge: true });
	}

	checkmate(winning_team) {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_CHECKMATE_WHITE : DB_CHECKMATE_BLACK); // checkmate

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	stalemate() {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(DB_STALEMATE); // stalement

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	draw() {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(DB_DRAW); // draw

		this.message(`[Accepted a draw.]`);
		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	timesup(winning_team) {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_TIMESUP_WHITE : DB_TIMESUP_BLACK); // timesup

		this.message(`[Resigned match.]`);
		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	resign(winning_team) {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_RESIGN_WHITE : DB_RESIGN_BLACK); // resign

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	undoMove() {
		let moves = (this.match && this.match.moves) ? this.match.moves : [];

		if (moves.length > 0) {
			moves.pop();
		}

		this.message(`[Gave mercy to opponent's move.]`);
		if (this.my_team == TEAM.B) {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				white_undo: DB_REQUEST_DONE,
				moves: moves,
			}, { merge: true });
		}
		else {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				black_undo: DB_REQUEST_DONE,
				moves: moves,
			}, { merge: true });
		}
	}

	cancelUndo() {
		if (this.my_team == TEAM.B) {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				white_undo: DB_REQUEST_NONE,
			}, { merge: true });
		}
		else {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				black_undo: DB_REQUEST_NONE,
			}, { merge: true });
		}
	}

	cancelDraw() {
		if (this.my_team == TEAM.B) {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				white_draw: DB_REQUEST_NONE,
			}, { merge: true });
		}
		else {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				black_draw: DB_REQUEST_NONE,
			}, { merge: true });
		}
	}

	registerOpponent(user_id) {
		let self = this;
		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			white: user_id,
			updated: new Date(),
		}, { merge: true });

		this.db.collection(USERS_TABLE).doc(user_id).get().then(doc => {
			let user = doc.data();
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(self.match_id);

			self.db.collection(USERS_TABLE).doc(user_id).set({
				matches: matches,
			}, { merge: true });
		});
	}

	message(message) {
		let chat = (this.match && this.match.chat) ? this.match.chat : [];
		chat.push(Util.packMessage(message, this.my_team));

		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			chat: chat,
		}, { merge: true });
	}

	changeTheme(theme) {
		this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
			theme: Util.packTheme(theme),
		}, { merge: true });
	}

	askUndo() {
		if (this.my_team == TEAM.B) {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				black_undo: DB_REQUEST_ASK,
			}, { merge: true });
		}
		else {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				white_undo: DB_REQUEST_ASK,
			}, { merge: true });
		}
	}

	askDraw() {
		if (this.my_team == TEAM.B) {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				black_draw: DB_REQUEST_ASK,
			}, { merge: true });
		}
		else {
			this.db.collection(MATCHES_TABLE).doc(this.match_id).set({
				white_draw: DB_REQUEST_ASK,
			}, { merge: true });
		}
	}
}
