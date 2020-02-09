const MATCHES_TABLE = "matches"
const USERS_TABLE = "users"

var firebaseDB = null
var firebaseUser = null

new Game()
initFirebase()
authFirebase()
initToolbar()

function initFirebase() {
	let config = {
	    apiKey: "AIzaSyDGTEzcebCXK3B4e--I2itLD0lBtXTQPYs",
	    authDomain: "web-chess-e5c05.firebaseapp.com",
	    databaseURL: "https://web-chess-e5c05.firebaseio.com",
	    projectId: "web-chess-e5c05",
	    storageBucket: "web-chess-e5c05.appspot.com",
	    messagingSenderId: "730184283244",
	    appId: "1:730184283244:web:34b7cb61dfe77db0049449",
	    measurementId: "G-8C72YJXJ07"
	};
	firebase.initializeApp(config);
	firebaseDB = firebase.firestore();
}


function authFirebase() {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			firebaseUser = user;
			db.collection(USERS_TABLE).doc(user.uid).set({
			    name: "",
			    current_match: ""
			})
		}
		else {
			$('#modal').modal({ keyboard: false })
		}
	});

	let config = {
		signInSuccessUrl: '/',
		signInOptions: [
		  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		],
		tosUrl: 'www.bing.com',
		privacyPolicyUrl: function() {
			window.location.assign('www.google.com');
		}
	};
	let ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', config);
}

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		firebase.auth().signOut();
	});

	// New match button
	$('#new-match-btn').on('click', (e) => {
		let match_id = firebaseDB.collection(MATCHES_TABLE).add({
		    first: "Ada",
		    last: "Lovelace",
		    born: 1815
		});
	});
}
