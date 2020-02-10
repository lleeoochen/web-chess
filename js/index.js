var user = null

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
		elements = elements.add(`<a class="btn btn-warning">${ user.matches[i] }</a><br/><br/>`)
	$('#matches-list').empty()
	$('#matches-list').append(elements)
}

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		firebase.auth().signOut();
	});

	// New match button
	$('#new-match-btn').on('click', (e) => {
		Firebase.createMatch(user);
		console.log("hi");
	});

	$('#chess-toolbar').removeAttr('hidden');
}
