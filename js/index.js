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

		$('#matches-display').append(results);
		$('#matches-display').append("hi");

		let copy = results;


		// Sort matches by dates for each opponent
		for (let i in results) {
			results[i].matches.sort((a, b) => {
				let a_time = a[1].updated || 0;
				if (typeof a_time == 'object') a_time = 0;

				let b_time = b[1].updated || 0;
				if (typeof b_time == 'object') b_time = 0;

				return b_time - a_time;
			});
		}

		// Sort opponent by latest date
		results.sort((r1, r2) => {
			let r1_time = r1.matches[0][1].updated || 0;
			if (typeof r1_time == 'object') r1_time = 0;

			let r2_time = r2.matches[0][1].updated || 0;
			if (typeof r2_time == 'object') r2_time = 0;

			return r2_time - r1_time;
		});

		for (let i in results) {
			let { enemy, matches } = results[i];
			let $matches = [];
			let $inactive_matches = [];
			let $grouped_matches = [];

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
								<img class="player-pic ${ color }" src="${ enemy.photo ? enemy.photo + '=c' : "assets/new_match.png" }"/>
							</div>
							<div>
								<div class="match-link-date"> ${ d_str } </div>
							</div>
						</div>
					</a>`;

				if (active)
					$matches.push(match_html);
				else
					$inactive_matches.push(match_html);
			});

			$matches.push(...$inactive_matches);

			$matches = groupList($matches, 1).map($match_group => {
				return `
					<div class="matches-column">
						${ $match_group }
					</div>
				`;
			});

			$('#matches-display').append(`
				<div class="opponent-container">
					<div class="player-title-bar">
						<div class="player-name">${ enemy.name || 'New Matches' }</div>
					</div>
					<div class="matches-list">
						${ $matches }
					</div>
				</div>
			`);
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
	$('#new-match-modal #theme-panel .btn').removeClass('outline');
	$(event.target).addClass('outline');
}

function selectMatchTime(event, _time) {
	time = _time;
	$('#new-match-modal #time-panel .btn').removeClass('outline');
	$(event.target).addClass('outline');
}

function groupList(data, n) {
	let group = [];
	for (let i = 0, j = 0; i < data.length; i++) {
		if (i >= n && i % n === 0)
			j++;
		group[j] = group[j] || [];
		group[j].push(data[i])
	}
	return group;
}