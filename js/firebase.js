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
			console.log (auth_user_1)
			if (auth_user_1) {
				auth_user = auth_user_1;
				callback(auth_user);
			}
			else {
				$('#modal').modal({ backdrop: 'static', keyboard: false })
			}
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

	static createMatch(user) {
		db.collection(MATCHES_TABLE).add({
		    first: "Cool",
		    last: "Cool",
		    born: 1815
		})
		.then(function(ref) {
			console.log(user)
			let matches = (user && user.matches) ? user.matches : [];
			matches.push(ref.id);

			db.collection(USERS_TABLE).doc(auth_user.uid).set({
				matches: matches
			}, { merge: true });
		})
	}
}

Firebase.init()
