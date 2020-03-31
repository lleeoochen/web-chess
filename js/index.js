var user = null;
var auth_user = null;
var database = new Firebase();

var theme = undefined;
var time = undefined;

database.authenticate((auth_user1) => {
	initToolbar();
	auth_user = auth_user1;
	database.getUser(auth_user1.uid).then((user_data) => {
		user = user_data;
		showMatches();
	});

	// database.listenUser(auth_user.uid, (user_data) => {
	// 	user = user_data;
	// })
});

function showMatches() {
	if (!user || !user.matches) return

	database.getMatches(user.matches, user, async (matches_data) => {
		var elements = $();
		matches_data.sort((a, b) => b[1].updated.toDate().getTime() - a[1].updated.toDate().getTime());
		await matches_data.forEach(match => {
			let match_name = match[0];
			let match_data = match[1];
			let match_opponent = match[2];

			let d = match_data.updated.toDate();
			let d_str = Util.formatDate(d);

			let color = (match_data.black == auth_user.uid) ? "B" : "W";

			if (match_data.moves && Math.floor(match_data.moves[match_data.moves.length - 1] / 10) != 0) {
				elements = elements.add(`
					<a class="btn btn-warning match-link" href="${ CHESS_URL }/game.html?match=${ match_name }">
						<div style="display: flex; align-items: center;">
							<div>
								<img src="assets/${color}King.svg"/>
							</div>
							<div style="text-align: left;">
								${ match_opponent ? match_opponent.name : "New Match" }<br/>
								<div class="match-link-date"> ${ d_str } </div>
							</div>
						</div>
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
		$('#new-match-modal').modal('show');
	});

	$('#new-match-modal #submit').on('click', (e) => {
		database.createMatch(user, theme, time, match_id => {
			window.location = `${ CHESS_URL }/game.html?match=${ match_id }`;
		});
		$('#new-match-modal').modal('hide');
	});

	$('#chess-toolbar').removeAttr('hidden');
}


function selectMatchTheme(event, _theme) {
	theme = _theme;
	$('#new-match-modal #theme-panel .utility-btn').removeClass('outline');
	$(event.target).addClass('outline');
}

function selectMatchTime(event, _time) {
	time = _time;
	$('#new-match-modal #time-panel .utility-btn').removeClass('outline');
	$(event.target).addClass('outline');
}
