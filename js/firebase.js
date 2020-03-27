const MATCHES_TABLE = "matches";
const USERS_TABLE = "users";

var db = null;
var auth_user = null;

class Firebase {

	static init() {
		// General Init
		let firebaseConfig = {
			apiKey: "AIzaSyDGTEzcebCXK3B4e--I2itLD0lBtXTQPYs",
			authDomain: "web-chess-e5c05.firebaseapp.com",
			databaseURL: "https://web-chess-e5c05.firebaseio.com",
			projectId: "web-chess-e5c05",
			storageBucket: "web-chess-e5c05.appspot.com",
			messagingSenderId: "730184283244",
			appId: "1:730184283244:web:34b7cb61dfe77db0049449",
			measurementId: "G-8C72YJXJ07"
		};
		firebase.initializeApp(firebaseConfig);
		db = firebase.firestore();

		// Authentication Init
		let firebaseAuthConfig = {
			signInSuccessUrl: window.location.href,
			signInOptions: [
				firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			],
			tosUrl: 'www.bing.com',
			privacyPolicyUrl: function() {
				window.location.assign('www.google.com');
			}
		};
		let ui = new firebaseui.auth.AuthUI(firebase.auth());
		ui.start('#firebaseui-auth-container', firebaseAuthConfig);
	}

	static authenticate(callback) {
		firebase.auth().onAuthStateChanged(function(auth_user_1) {
			if (auth_user_1) {
				auth_user = auth_user_1;

				db.collection(USERS_TABLE).doc(auth_user.uid).set({
					email: auth_user.email,
					photoURL: auth_user.photoURL,
					displayName: auth_user.displayName
				}, { merge: true });
				callback(auth_user);
			}
			else {
				$('#modal').modal({ backdrop: 'static', keyboard: false })
			}
		});
	}

	static getMatch(id, callback) {
		db.collection(MATCHES_TABLE).doc(id).get().then(doc => {
			console.log("Match get: ", doc.data());
			callback(doc.data());
		});
	}

	static getMatches(ids, user, callback) {
		let total = Math.floor(ids.length / 10) + 1;
		let sent = 0;
		let result = [];

		// let user_cache = {};

		for (let i = 0; i < total; i++) {
			var data = ids.slice(i * 10, i * 10 + 10);
			db.collection(MATCHES_TABLE).where(firebase.firestore.FieldPath.documentId(), "in", data).get().then(async snapshot => {
				await snapshot.forEach(function(doc) {
					let id = (auth_user.uid == doc.data()["black"]) ? doc.data()["white"] : doc.data()["black"];

					if (id) {
						Firebase.getUser(id, (user) => {
							result.push([doc.id, doc.data(), user]);
							sent ++;
							if (sent == ids.length) {
								callback(result);
							}
						});
					}
					else {
						sent ++;
						result.push([doc.id, doc.data(), null]);
						if (sent == ids.length) {
							callback(result);
						}
					}
					// if (user_cache[id]) {
					// 	 result.push([doc.id, doc.data(), user_cache[id]]);
					// }
					// else {
					// 	Firebase.getUser(id, (user) => {
					// 		result.push([doc.id, doc.data(), user]);
					// 		user_cache[id] = user;
					// 		sent ++;
					// 		if (sent == ids.length) {
					// 			callback(result);
					// 		}
					// 	});
					// }
				});
			});
		}
	}

	static getUser(id, callback) {
		db.collection(USERS_TABLE).doc(id).get().then(doc => {
			console.log("User get: ", doc.data());
			callback(doc.data());
		});
	}

	static listenMatch(id, callback) {
		db.collection(MATCHES_TABLE).doc(id).onSnapshot(function(doc) {
			console.log("Match updated: ", doc.data());
			callback(doc.data());
		});
	}

	static listenUser(id, callback) {
		db.collection(USERS_TABLE).doc(id).onSnapshot(function(doc) {
			console.log("User updated: ", doc.data());
			callback(doc.data());
		});
	}

	static createMatch(user, callback) {
		db.collection(MATCHES_TABLE).add({
			black: auth_user.uid,
			white: null,
			moves: [],
			theme: DB_THEME_CLASSIC,
			updated: new Date(),
			black_timer: MAX_TIME,
			white_timer: MAX_TIME,
			black_undo: DB_REQUEST_NONE,
			white_undo: DB_REQUEST_NONE,
			black_draw: DB_REQUEST_NONE,
			white_draw: DB_REQUEST_NONE,
		})
		.then(async function(ref) {
			console.log(user.matches);
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(ref.id);

			await db.collection(USERS_TABLE).doc(auth_user.uid).set({
				matches: matches
			}, { merge: true });

			callback(ref.id);
		})
	}

	static updateChessboard(match_id, match, oldGrid, newGrid, turn, black_timer, white_timer) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(Util.pack(oldGrid, newGrid, turn));

		console.log(black_timer);
		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date(),
			black_timer: black_timer,
			white_timer: white_timer,
		}, { merge: true });
	}

	static updateTimer(match_id, match, black_timer, white_timer) {
		db.collection(MATCHES_TABLE).doc(match_id).set({
			black_timer: black_timer,
			white_timer: white_timer,
		}, { merge: true });
	}

	static addTime(match_id, match, time) {
		let t = match.updated.toDate();
		t.setSeconds(t.getSeconds() + time);

		db.collection(MATCHES_TABLE).doc(match_id).set({
			updated: t
		}, { merge: true });
	}

	static checkmate(match_id, match, winning_team) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_CHECKMATE_WHITE : DB_CHECKMATE_BLACK); // checkmate

		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static stalemate(match_id, match) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(DB_STALEMATE); // stalement

		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static draw(match_id, match) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(DB_DRAW); // draw

		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static timesup(match_id, match, winning_team) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_TIMESUP_WHITE : DB_TIMESUP_BLACK); // timesup

		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static resign(match_id, match, winning_team) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(winning_team == TEAM.W ? DB_RESIGN_WHITE : DB_RESIGN_BLACK); // resign

		db.collection(MATCHES_TABLE).doc(match_id).set({
			moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static undoMove(match_id, match) {
		let moves = (match && match.moves) ? match.moves : [];

		if (moves.length > 0) {
			moves.pop();
		}

		if (my_team == TEAM.B) {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				white_undo: DB_REQUEST_DONE,
				moves: moves,
				updated: new Date()
			}, { merge: true });
		}
		else {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				black_undo: DB_REQUEST_DONE,
				moves: moves,
				updated: new Date()
			}, { merge: true });
		}
	}

	static cancelUndo(match_id, match) {
		if (my_team == TEAM.B) {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				white_undo: DB_REQUEST_NONE,
			}, { merge: true });
		}
		else {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				black_undo: DB_REQUEST_NONE,
			}, { merge: true });
		}
	}

	static cancelDraw(match_id, match) {
		if (my_team == TEAM.B) {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				white_draw: DB_REQUEST_NONE,
			}, { merge: true });
		}
		else {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				black_draw: DB_REQUEST_NONE,
			}, { merge: true });
		}
	}

	static registerOpponent(match_id, user_id) {
		db.collection(MATCHES_TABLE).doc(match_id).set({
			white: user_id,
			updated: new Date(),
		}, { merge: true });

		db.collection(USERS_TABLE).doc(user_id).get().then(doc => {
			let user = doc.data();
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(match_id);

			db.collection(USERS_TABLE).doc(user_id).set({
				matches: matches,
			}, { merge: true });
		});
	}

	static message(match_id, match, message, my_team) {
		let chat = (match && match.chat) ? match.chat : [];
		chat.push(Util.packMessage(message, my_team));

		db.collection(MATCHES_TABLE).doc(match_id).set({
			chat: chat,
			updated: new Date()
		}, { merge: true });
	}

	static changeTheme(match_id, match, theme) {
		db.collection(MATCHES_TABLE).doc(match_id).set({
			theme: Util.packTheme(theme),
		}, { merge: true });
	}

	static askUndo(match_id, match, my_team) {
		if (my_team == TEAM.B) {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				black_undo: DB_REQUEST_ASK,
			}, { merge: true });
		}
		else {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				white_undo: DB_REQUEST_ASK,
			}, { merge: true });
		}
	}

	static askDraw(match_id, match, my_team) {
		if (my_team == TEAM.B) {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				black_draw: DB_REQUEST_ASK,
			}, { merge: true });
		}
		else {
			db.collection(MATCHES_TABLE).doc(match_id).set({
				white_draw: DB_REQUEST_ASK,
			}, { merge: true });
		}
	}
}

Firebase.init();
