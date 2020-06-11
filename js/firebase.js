---
---

// Base class of database storage
class Firebase {

	constructor() {
		this.auth_user = null;
		this.socket = io.connect('{{ site.backendUrl }}');

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

	authenticate(resolve) {
		firebase.auth().onAuthStateChanged(auth_user => {
			if (!auth_user) {
				$('#firebase-modal').modal({ backdrop: 'static', keyboard: false })
				return;
			}

			this.auth_user = auth_user;

			Util.request('POST', '/login', { uid: auth_user.uid }).then(res => {
				Util.setCookie('session_id', res.session_id, 1);
				resolve();
			});

		});
	}

	getMatch(id) {
		return Util.request('GET', '/get_match?id=' + id);
	}

	getMatches(ids) {
		return Util.request('GET', '/get_matches?ids=' + JSON.stringify(ids));
	}

	getProfile() {
		return Util.request('GET', '/get_profile');
	}

	getUser(id) {
		return Util.request('GET', '/get_user?id=' + id);
	}

	listenMatch(id, resolve) {
		this.socket.emit('listen_match', id);
		this.socket.on('listen_match_' + id, data => {
			resolve(data);
		});
	}

	listenUser(id, resolve) {
		this.socket.emit('listen_user', id);
		this.socket.on('listen_match_' + id, data => {
			resolve(data);
		});
	}

	createMatch(theme, time) {
		return Util.request('POST', '/create_match', {
			theme: Util.packTheme(theme),
			time: time || MAX_TIME
		});
	}
}
