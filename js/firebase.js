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


		for (let i = 0; i < total; i++) {
		    var data = ids.slice(i * 10, i * 10 + 10);
			db.collection(MATCHES_TABLE).where(firebase.firestore.FieldPath.documentId(), "in", data).get().then(async snapshot => {
				await snapshot.forEach(function(doc) {
		            result.push([doc.id, doc.data()]);
		        });

				sent++;
				if (sent == total) {
					callback(result);					
				}
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
			updated: new Date()
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

	static updateChessboard(match_id, match, oldGrid, newGrid, turn) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(Util.pack(oldGrid, newGrid, turn));

		db.collection(MATCHES_TABLE).doc(match_id).set({
		    moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static checkmate(match_id, match, winning_team) {
		let moves = (match && match.moves) ? match.moves : [];
		moves.push(winning_team == TEAM.W ? 0 : 1); // checkmate

		db.collection(MATCHES_TABLE).doc(match_id).set({
		    moves: moves,
			updated: new Date()
		}, { merge: true });
	}

	static registerOpponent(match_id, user_id) {
		db.collection(MATCHES_TABLE).doc(match_id).set({
		    white: user_id,
		}, { merge: true });

		db.collection(USERS_TABLE).doc(user_id).get().then(doc => {
			let user = doc.data();
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(match_id);

			db.collection(USERS_TABLE).doc(user_id).set({
				matches: matches
			}, { merge: true });
		});
	}
}

Firebase.init()
