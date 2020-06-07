// Base class of database storage
class Firebase {
	// db = null;
	// auth_user = null;

	constructor() {
		this.db = null;
		this.auth_user = null;

		// General Init
		let firebaseConfig = {
			apiKey: "AIzaSyAjnKviJftJE7M0a4ylnMeVpMjI8Y-uG_Q",
			authDomain: "gamedb-f807e.firebaseapp.com",
			databaseURL: "https://gamedb-f807e.firebaseio.com",
			projectId: "gamedb-f807e",
			storageBucket: "gamedb-f807e.appspot.com",
			messagingSenderId: "364782423342",
			appId: "1:364782423342:web:9f0c875b6e988527e3bebf"
		};
		firebase.initializeApp(firebaseConfig);
		this.db = firebase.firestore();

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
		ui.start('#firebase-modal .modal-body', firebaseAuthConfig);
	}

	authenticate(callback) {
		var self = this;

		firebase.auth().onAuthStateChanged(function(auth_user) {
			if (auth_user) {
				self.auth_user = auth_user;
				console.log(self.auth_user);

				self.db.collection(USERS_TABLE).doc(self.auth_user.uid).set({
					email: self.auth_user.email,
					photo: self.auth_user.photoURL,
					name: self.auth_user.displayName
				}, { merge: true });
				callback(self.auth_user);
			}
			else {
				$('#firebase-modal').modal({ backdrop: 'static', keyboard: false })
			}
		});
	}

	getMatch(id, callback) {
		this.db.collection(MATCHES_TABLE).doc(id).get().then(doc => {
			console.log("Match get: ", doc.data());
			callback(doc.data());
		});
	}

	getMatches(ids, user, callback) {
		let total = Math.ceil(ids.length / 10);
		let sent = 0;
		let result = [];
		var self = this;

		// let user_cache = {};

		for (let i = 0; i < total; i++) {
			var data = ids.slice(i * 10, i * 10 + 10);
			this.db.collection(MATCHES_TABLE).where(firebase.firestore.FieldPath.documentId(), "in", data).get().then(async snapshot => {
				await snapshot.forEach(function(doc) {
					let id = (self.auth_user.uid == doc.data()["black"]) ? doc.data()["white"] : doc.data()["black"];

					if (id) {
						self.getUser(id).then((user) => {
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
					// 	self.getUser(id, (user) => {
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

	getUser(id) {
		return this.db.collection(USERS_TABLE).doc(id).get().then(doc => {
			console.log("User get: ", doc.data());
			return doc.data();
		});
	}

	listenMatch(id, callback) {
		this.db.collection(MATCHES_TABLE).doc(id).onSnapshot(function(doc) {
			console.log("Match updated: ", doc.data());
			callback(doc.data());
		});
	}

	listenUser(id, callback) {
		this.db.collection(USERS_TABLE).doc(id).onSnapshot(function(doc) {
			console.log("User updated: ", doc.data());
			callback(doc.data());
		});
	}

	createMatch(user, theme, time, callback) {
		let self = this;

		this.db.collection(MATCHES_TABLE).add({
			black: this.auth_user.uid,
			white: null,
			moves: [],
			chat: [],
			theme: Util.packTheme(theme),
			updated: new Date(),
			black_timer: time || MAX_TIME,
			white_timer: time || MAX_TIME,
			black_undo: DB_REQUEST_NONE,
			white_undo: DB_REQUEST_NONE,
			black_draw: DB_REQUEST_NONE,
			white_draw: DB_REQUEST_NONE,
		})
		.then(async function(ref) {
			console.log(user.matches);
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(ref.id);

			await self.db.collection(USERS_TABLE).doc(self.auth_user.uid).set({
				matches: matches
			}, { merge: true });

			callback(ref.id);
		})
	}
}
