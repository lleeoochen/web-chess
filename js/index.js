---
---
// Redirect based on screen orientation
if (SCREEN_PORTRAIT && !window.location.href.includes('mobile')) window.location = '{{ site.baseUrl }}/mobile';
if (!SCREEN_PORTRAIT && window.location.href.includes('mobile')) window.location = '{{ site.baseUrl }}/';

var user = null;
var user_id = null;
var database = new Firebase();

var theme = undefined;
var time = 15 * 60;

var sample_user = 'uTglgv6iP4cEzJlVFp0ZOsnsiL13';
var sample_match = 'zRhSeePjyI6JyVtDBCmS';


// Don't call main if react native controlls it
if (!window.ReactNativeWebView) {
	main();
}


function main() {
	database.getProfile().then(res => {
		user = res.data;
		user_id = res.id;
		let matches_dict = {};
		let matches_promises = [];
		let stats = {
			draw: 0,
			stalemate: 0,
			win: 0,
			lose: 0,
			ongoing: 0,
			resign: 0,
		};
		initToolbar();

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
						<div class="btn match-link ${active ? '': 'inactive'} ${ color }" onclick="onMatchClick('${ match_name }')">
							<div class="match-link-content">
									<img class="player-pic" src="${ enemy.photo ? enemy.photo + '=c' : "assets/new_match.png" }"/>
								<div>
									<div class="match-link-date"> ${ d_str } </div>
								</div>
							</div>
						</div>`;

					if (active) {
						$matches.push(match_html);
						stats.ongoing += 1;
					}
					else {
						$inactive_matches.push(match_html);

						let win = Util.win(match_data.moves[match_data.moves.length - 1], color);
						if (win === true) stats.win += 1;
						else if (win === false) stats.lose += 1;
						else if (win === 0) stats.draw += 1;
						else if (win === 1) stats.stalemate += 1;
						else if (win === 2) stats.resign += 1;
					}
				});

				$matches.push(...$inactive_matches);

				$matches = groupList($matches, 1).map($match_group => {
					return `
						<div class="matches-column">
							${ $match_group }
						</div>
					`;
				});

				let $opponent_container = `
					<div class="opponent-container">
						<div class="player-title-bar">
							<div class="player-name">${ enemy.name || 'New Matches' }</div>
						</div>
						<div class="matches-list">
							${ $matches }
						</div>
					</div>
				`;

				if (enemy.name)
					$('#matches-display').append($opponent_container);
				else
					$('#matches-display').prepend($opponent_container);
			}

			// Update stats
			$('#menu-stats').append(`
				<div>Win Rate ${ (stats.win * 100.0 / (stats.win + stats.lose)).toFixed(2) }%.</div>
				<div>Win ${ stats.win } games.</div>
				<div>Lose ${ stats.lose } games.</div>
				<div>Draw ${ stats.draw } games.</div>
				<div>Stalemate ${ stats.stalemate } games.</div>
				<div>Resign ${ stats.draw } games.</div>
				<div>Ongoing ${ stats.ongoing } games.</div>
				<br>
			`);

		});
	});
}

function initToolbar() {
	// Signout button
	$('#signout-btn').on('click', (e) => {
		if (window.ReactNativeWebView) {
			window.ReactNativeWebView.postMessage(JSON.stringify({
				type: 'signout'
			}));
		}
		else {
			database.logout().then(async () => {
				await Firebase.signOut();
				localStorage.removeItem(SESSION_TOKEN)
				location.reload();
			});
		}
	});

	// Menu button
	$('#menu-btn').on('click', (e) => {
		$('#menu-modal').modal('show');
	});
	$('#menu-modal #menu-name').text(user.name);
	$('#menu-modal #menu-photo').attr('src', user.photo);

	// New match button
	$('#new-match-btn').on('click', (e) => {
		$('#new-match-modal').modal('show');
	});

	$('#new-match-modal #submit').on('click', (e) => {
		database.createMatch(theme, time).then(async match_id => {
			window.location = `{{ site.baseUrl }}/game${ SCREEN_PORTRAIT ? '_mobile' : '' }?match=${ match_id }`;
		});
		$('#new-match-modal').modal('hide');
	});

	if (Util.getParam("no_action_bar") != '1') {
		$('#chess-toolbar').removeClass('hidden');
	}
	else {
		document.documentElement.style.setProperty('--toolbar-height', '0px');
	}
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

function onMatchClick(match) {
	if (window.ReactNativeWebView)
		window.ReactNativeWebView.postMessage(JSON.stringify({
			type: 'match_click',
			match: match
		}));
	else
		window.location = `{{ site.baseUrl }}/game${ SCREEN_PORTRAIT ? '_mobile' : '' }?match=${ match }`;
}


function setStorage(key, val) {
	localStorage.setItem(key, val);
}
