class Util {
	static checkPosition(pos) {
		if (pos != null && this.inBound(pos.x) && this.inBound(pos.y))
			return pos;
		else
			return null;
	}
	static inBound(i) {
		return i >= 0 && i < BOARD_SIZE;
	}

	// https://stackoverflow.com/a/21903119
	static getParam(sParam) {
	    var sPageURL = window.location.search.substring(1),
	        sURLVariables = sPageURL.split('&'),
	        sParameterName,
	        i;

	    for (i = 0; i < sURLVariables.length; i++) {
	        sParameterName = sURLVariables[i].split('=');

	        if (sParameterName[0] === sParam) {
	            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
	        }
	    }
	}

	static vw2px(v) {
		return v * document.documentElement.clientWidth / 100;
	}

	static vh2px(v) {
		return v * document.documentElement.clientHeight / 100;
	}

	static reloadStylesheets() {
	    var queryString = '?reload=' + new Date().getTime();
	    $('link[rel="stylesheet"]').each(function () {
	        this.href = this.href.replace(/\?.*|$/, queryString);
	    });
	}

	static pack(oldGrid, newGrid, turn) {
		return oldGrid.x * 10000 + oldGrid.y * 1000 + newGrid.x * 100 + newGrid.y * 10 + (turn == TEAM.W ? 1 : 0);
	}

	static unpack(data) {
		return {
			old_x: Math.floor(data / 10000),
			old_y: Math.floor((data % 10000) / 1000),
			new_x: Math.floor((data % 1000) / 100),
			new_y: Math.floor((data % 100) / 10),
			turn: (Math.floor((data % 10) / 1) == 1) ? TEAM.W : TEAM.B
		};
	}

	static packTheme(theme) {
		if (theme == THEME_CLASSIC) {
			return DB_THEME_CLASSIC;
		}
		else if (theme == THEME_WINTER) {
			return DB_THEME_WINTER;
		}
		else if (theme == THEME_METAL) {
			return DB_THEME_METAL;
		}
		else if (theme == THEME_NATURE) {
			return DB_THEME_NATURE;
		}
		return DB_THEME_CLASSIC;
	}

	static unpackTheme(data) {
		if (data == DB_THEME_CLASSIC) {
			return THEME_CLASSIC;
		}
		else if (data == DB_THEME_WINTER) {
			return THEME_WINTER;
		}
		else if (data == DB_THEME_METAL) {
			return THEME_METAL;
		}
		else if (data == DB_THEME_NATURE) {
			return THEME_NATURE;
		}
		return THEME_CLASSIC;
	}

	static packMessage(message, my_team) {
		return my_team + message;
	}

	static unpackMessage(data) {
		return {
			team: data[0],
			message: data.slice(1)
		};
	}

	// https://stackoverflow.com/a/8888498
	static formatDate(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		hours = hours < 10 ? '0' + hours : hours;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = (date.getMonth() + 1) + "/" + date.getDate() + " " + hours + ':' + minutes + ampm;
		return strTime;
	}

	static formatTimer(timer) {
		let min = Math.floor(timer / 60);
		let sec = timer - min * 60;
		min = min < 10 ? '0' + min : min;
		sec = sec < 10 ? '0' + sec : sec;
		return min + ":" + sec;
	}

	static gameFinished(move) {
		// return true;

		if (move == DB_STALEMATE) {
			swal('Stalemate.', {button: false });
			return true;
		}
		else if (move == DB_DRAW) {
			swal('Draw.', {button: false });
			return true;
		}
		else if (move == DB_CHECKMATE_BLACK) {
			swal('Checkmate. Black Team Wins!', { button: false });
			return true;
		}
		else if (move == DB_CHECKMATE_WHITE) {
			swal('Checkmate. White Team Wins!', { button: false });
			return true;
		}
		else if (move == DB_TIMESUP_BLACK) {
			swal('Time\'s Up. Black Team Wins!', { button: false });
			return true;
		}
		else if (move == DB_TIMESUP_WHITE) {
			swal('Time\'s Up. White Team Wins!', { button: false });
			return true;
		}
		else if (move == DB_RESIGN_BLACK) {
			swal('White Resigned. Black Team Wins!', { button: false });
			return true;
		}
		else if (move == DB_RESIGN_WHITE) {
			swal('Black Resigned. White Team Wins!', { button: false });
			return true;
		}
		else {
			return false;
		}
	}
}
