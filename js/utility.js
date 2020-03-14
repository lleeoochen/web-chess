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
		var strTime = date.getMonth() + "/" + date.getDate() + " " + hours + ':' + minutes + ampm;
		return strTime;
	}
}
