var user = null
const CHESS_URL = "/web-chess"
// const CHESS_URL = ""

Firebase.authenticate((auth_user) => {
	initToolbar();

	Firebase.listenUser(auth_user.uid, (user_data) => {
		user = user_data;
		showMatches();
	})
});

function showMatches() {
	if (!user || !user.matches) return
	var elements = $();
	for (let i = 0; i < user.matches.length; i++)
		elements = elements.add(`<a class="btn btn-warning match-link" href="${ CHESS_URL }/game.html?match=${ user.matches[i] }">${ user.matches[i] }</a><br/><br/>`)
	$('#matches-list').empty()
	$('#matches-list').append(elements)
}

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		firebase.auth().signOut();
		location.reload();
	});

	// New match button
	$('#new-match-btn').on('click', (e) => {
		Firebase.createMatch(user);
		console.log("hi");
	});

	$('#chess-toolbar').removeAttr('hidden');
}
