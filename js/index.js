---
---

var user = null;
var auth_user = null;
var database = new Firebase();

var theme = undefined;
var time = 15 * 60;

database.authenticate((auth_user1) => {
	initToolbar();
	auth_user = auth_user1;
	database.listenUser(auth_user1.uid, (user_data) => {
		user = user_data;
		showMatches();
	});
});

function showMatches() {
	if (!user || !user.matches) return

	database.getMatches(user.matches, user, async (matches_data) => {
		$('#matches-list').html('<div id="matches-list-divider" class="hidden"></div>');

		matches_data.sort((a, b) => b[1].updated.toDate().getTime() - a[1].updated.toDate().getTime());
		await matches_data.forEach(match => {
			let match_name = match[0];
			let match_data = match[1];
			let match_opponent = match[2];

			let d = match_data.updated.toDate();
			let d_str = Util.formatDate(d);

			let color = (match_data.black == auth_user.uid) ? "B" : "W";
			let active = Math.floor(match_data.moves[match_data.moves.length - 1] / 10) != 0;

			let match_html = $(`
				<a class="btn match-link ${active ? '': 'inactive'}" href="{{ site.baseUrl }}/game.html?match=${ match_name }">
					<div class="match-link-content">
						<div>
							<img src="assets/${color}King.svg"/>
						</div>
						<div>
							${ match_opponent ? match_opponent.name : "New Match" }<br/>
							<div class="match-link-date"> ${ d_str } </div>
						</div>
					</div>
				</a>`
			);

			if (active)
				match_html.insertBefore('#matches-list-divider');
			else
				$('#matches-list').append(match_html);
		});
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
			window.location = `{{ site.baseUrl }}/game.html?match=${ match_id }`;
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
