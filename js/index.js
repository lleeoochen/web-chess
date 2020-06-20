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
	let matches_dict = {};
	let matches_promises = [];

	user.matches.forEach(match => {
		let [match_id, enemy_id] = match.split('-');
		enemy_id = enemy_id || 'none'; 
		matches_dict[enemy_id] = matches_dict[enemy_id] || [];
		matches_dict[enemy_id].push(match_id);
	});

	for (let enemy_id in matches_dict) {
		matches_promises.push(
			database.getMatches(enemy_id, matches_dict[enemy_id])
		);
	}

	Promise.all(matches_promises).then(async results => {

		console.log(results)

		// Sort matches by dates for each opponent
		for (let i in results) {
			results[i].matches.sort((a, b) => b[1].updated - a[1].updated);
		}

		console.log(results)

		// Sort opponent by latest date
		results.sort((r1, r2) => {
			return r2.matches[0][1].updated - r1.matches[0][1].updated;
		});

		for (let i in results) {
			let { enemy, matches } = results[i];
			let $active_matches = '';
			let $inactive_matches = '';

			matches.forEach(match => {
				let match_name = match[0];
				let match_data = match[1];

				let d = new Date(match_data.updated);
				let d_str = Util.formatDate(d, '%M/%D');

				let color = (match_data.black == user_id) ? "B" : "W";
				let active = Math.floor(match_data.moves[match_data.moves.length - 1] / 10) != 0;

				let match_html = `
					<a class="btn match-link ${active ? '': 'inactive'}" href="{{ site.baseUrl }}/game.html?match=${ match_name }">
						<div class="match-link-content">
							<div>
								<img src="assets/${color}King.svg"/>
							</div>
							<div>
								<div class="match-link-date"> ${ d_str } </div>
							</div>
						</div>
					</a>`;

				if (active)
					$active_matches += match_html;
				else
					$inactive_matches += match_html;
			});

			if (enemy.name) {
				$('#matches-display').append(`
					<div class="opponent-container">
						<div class="player-title-bar">
							<img class="player-pic" src="${ enemy.photo }"/>
							<div class="player-name">${ enemy.name }</div>
						</div>
						<div class="matches-list">
							${ $active_matches }
							${ $inactive_matches }
						</div>
					</div>
				`);
			}
			else {
				$('#matches-display').prepend(`
					<div class="opponent-container">
						<div class="player-title-bar">
							<img class="player-pic" src="assets/new_match.png"/>
							<div class="player-name">New Matches</div>
						</div>
						<div class="matches-list">
							${ $active_matches }
							${ $inactive_matches }
						</div>
					</div>
				`);
			}
		}

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
