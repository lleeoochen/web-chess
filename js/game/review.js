var stopPlayBack = false;
var playTimeout = null;

async function reviewMove(moves_target, timeout=0) {
	playingBack.set(true);

	while (moves_applied > 0 && moves_applied > moves_target && !stopPlayBack) {
		unmoveChess();
		updateReviewButtons();
	}

	while (moves_applied < match.moves.length - 1 && moves_applied < moves_target && !stopPlayBack) {
		let move = Util.unpack(match.moves[moves_applied]);
		if (turn != my_team) {
			move.old_y = BOARD_SIZE - move.old_y - 1;
			move.new_y = BOARD_SIZE - move.new_y - 1;
		}

		await new Promise((resolve, reject) => {
		  playTimeout = setTimeout(() => {
			if (!stopPlayBack) {
				moveChess(chessboard[move.old_x][move.old_y], chessboard[move.new_x][move.new_y]);
				turn = move.turn;
				updateReviewButtons();
			}
			resolve();
		  }, timeout);
		});
	}

	clearTimeout(playTimeout);
	playingBack.set(false);
}

async function onFastBackwardClick() {
	await pausePlayback();

	stopPlayBack = false;
	await reviewMove(0);
	stopPlayBack = true;
}

async function onBackwardClick() {
	await pausePlayback();

	stopPlayBack = false;
	await reviewMove(moves_applied - 1);
	stopPlayBack = true;
}

async function onForwardClick() {
	await pausePlayback();

	stopPlayBack = false;
	await reviewMove(moves_applied + 1);
	stopPlayBack = true;
}

async function onFastForwardClick() {
	await pausePlayback();

	stopPlayBack = false;
	await reviewMove(match.moves.length - 1);
	stopPlayBack = true;
}

async function onPlaybackClick() {
	if (playingBack.get()) {
		$('#playback-btn img').attr('src', 'assets/play.png');
		await pausePlayback();
		return;
	}

	$('#playback-btn img').attr('src', 'assets/pause.png');

	stopPlayBack = false;
	await reviewMove(match.moves.length - 1, 700);
	stopPlayBack = true;

	$('#playback-btn img').attr('src', 'assets/play.png');
}

async function pausePlayback() {
	stopPlayBack = true;
	if (playingBack.get()) {
		$('#playback-btn img').attr('src', 'assets/play.png');
		await playingBack.promise;
	}
}


function updateReviewButtons() {
	enableHtml('#fast-backward-btn .utility-btn', moves_applied > 0);
	enableHtml('#backward-btn .utility-btn', moves_applied > 0);
	enableHtml('#fast-forward-btn .utility-btn', moves_applied < match.moves.length - 1);
	enableHtml('#forward-btn .utility-btn', moves_applied < match.moves.length - 1);
	enableHtml('#playback-btn .utility-btn', moves_applied < match.moves.length - 1);
}

// variable
function PlayingBack() {
    var value;

    this.set = function(v) {
        value = v;

        if (value == false)
	        Promise.resolve();
    }

    this.get = function() {
        return value;
    }

    var promise = new Promise(this.set);
}

var playingBack = new PlayingBack();
playingBack.set(false);
