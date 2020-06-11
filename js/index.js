---
---

var user = null;
var user_id = null;
var database = new Firebase();

var theme = undefined;
var time = 15 * 60;

var sample_user = 'uTglgv6iP4cEzJlVFp0ZOsnsiL13';
var sample_match = 'zRhSeePjyI6JyVtDBCmS';


// // Socket connection
// let socket = io.connect('{{ site.backendUrl }}');

// socket.emit('listen_user', sample_user);
// socket.on('listen_user', (user_data) => {
// 	console.log('user_data', user_data);
// });

// socket.emit('listen_match', sample_match);
// socket.on('listen_match', (match_data) => {
// 	console.log('match_data', match_data);
// });

// window.onbeforeunload = function(){
// 	socket.emit('disconnect');
// 	console.log("Bye now!");
// };

// database.listenMatch(sample_match, match => {
// 	console.log(match);
// });

// database.getMatch(sample_match, match => {
// 	console.log(match)
// })


database.getProfile().then(res => {
	initToolbar();

	user = res.data;
	user_id = res.id;

	database.getMatches(user.matches).then(async matches_data => {
		matches_data = matches_data.data;
		console.log(matches_data)
		$('#matches-list').html('<div id="matches-list-divider" class="hidden"></div>');

		matches_data.sort((a, b) => b[1].updated - a[1].updated);
		await matches_data.forEach(match => {
			let match_name = match[0];
			let match_data = match[1];
			let match_opponent = match[2];

			let d = new Date(match_data.updated);
			let d_str = Util.formatDate(d);

			let color = (match_data.black == user_id) ? "B" : "W";
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
});

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		database.logout().then(() => {
			firebase.auth().signOut();
			location.reload();
		});
	});

	// New match button
	$('#new-match-btn').on('click', (e) => {
		$('#new-match-modal').modal('show');
	});

	$('#new-match-modal #submit').on('click', (e) => {
		database.createMatch(theme, time).then(async match_id => {
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
