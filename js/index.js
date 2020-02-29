var user = null

Firebase.authenticate((auth_user) => {
	initToolbar();
	Firebase.getUser(auth_user.uid, (user_data) => {
		user = user_data;
		showMatches();
	});

	// Firebase.listenUser(auth_user.uid, (user_data) => {
	// 	user = user_data;
	// })
});

function showMatches() {
	if (!user || !user.matches) return

	Firebase.getMatches(user.matches, user, async matches_data => {
		var elements = $();
		console.log(matches_data);
		matches_data.sort((a, b) => b[1].updated.toDate().getTime() - a[1].updated.toDate().getTime());
		await matches_data.forEach(match => {
			let match_name = match[0];
			let match_data = match[1];
			let match_opponent = match[2];

			let d = match_data.updated.toDate();
			let d_str = formatDate(d);

			if (match_data.moves && Math.floor(match_data.moves[match_data.moves.length - 1] / 10) != 0) {
				elements = elements.add(`
					<a class="btn btn-warning match-link" href="${ CHESS_URL }/game.html?match=${ match_name }">
						${ match_opponent ? match_opponent.displayName : "New Match" }<br/>
						<div class="match-link-date"> ${ d_str } </div>
					</a>`
				);
			}
		});

		$('#matches-list').empty();
		$('#matches-list').append(elements);
	});

}

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		firebase.auth().signOut();
		location.reload();
	});

	// New match button
	$('#new-match-btn').on('click', (e) => {
		Firebase.createMatch(user, match_id => {
			window.location = `${ CHESS_URL }/game.html?match=${ match_id }`;
		});
	});

	$('#chess-toolbar').removeAttr('hidden');
}

// https://stackoverflow.com/a/8888498
function formatDate(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = date.getMonth() + "/" + date.getDate() + " " + hours + ':' + minutes + ampm;
	return strTime;
}
