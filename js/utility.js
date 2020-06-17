---
---

class Util {
	static request(method, url, body) {

		return new Promise(async (resolve, reject) => {
			let time_start = new Date().getTime();

			const response = await fetch('{{ site.backendUrl }}' + url, {
				method: method, // *GET, POST, PUT, DELETE, etc.
				mode: 'cors', // no-cors, *cors, same-origin
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'include', // include, *same-origin, omit
				headers: {
					'Content-Type': 'application/json'
				},
				redirect: 'follow', // manual, *follow, error
				referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
				body: JSON.stringify(body) // body data type must match "Content-Type" header
			});

			let short_url = url.split('?')[0];
			let duration = new Date().getTime() - time_start;
			console.log('Request Time ' + short_url + ': ' + duration);

			// Session expired
			if (response.status >= 400) {
				console.error('ERROR ' + short_url + ': ' + await response.json());
				if (response.status == 401) {
					localStorage.setItem(LAST_VISITED_KEY, window.location.href);
					window.location = '{{ site.baseUrl }}/login';
					return;
				}
				reject(response);
			}
			else {
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.indexOf("application/json") !== -1)
					resolve(response.json());
				else
					resolve(response);
			}
		});
	}

	static setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	static getCookie(cname) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(';');
		for(let i = 0; i <ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') {
			  c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
			  return c.substring(name.length, c.length);
			}
		}
		return "";
	}

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

	static unpack(data, flipped) {
		let move = {
			old_x: Math.floor(data / 10000),
			old_y: Math.floor((data % 10000) / 1000),
			new_x: Math.floor((data % 1000) / 100),
			new_y: Math.floor((data % 100) / 10),
			turn: (Math.floor((data % 10) / 1) == 1) ? TEAM.W : TEAM.B
		};

		if (flipped) {
			move.old_x = BOARD_SIZE - move.old_x - 1;
			move.new_x = BOARD_SIZE - move.new_x - 1;
			move.old_y = BOARD_SIZE - move.old_y - 1;
			move.new_y = BOARD_SIZE - move.new_y - 1;
		}

		return move;
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
	static formatDate(date, format='%M/%D %h:%m %z') {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		hours = hours < 10 ? '0' + hours : hours;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = format.replace('%M', (date.getMonth() + 1) || '')
							.replace('%D', date.getDate() || '')
							.replace('%h', hours || '')
							.replace('%m', minutes || '')
							.replace('%z', ampm || '');
		return strTime;
	}

	static formatTimer(timer) {
		let min = Math.floor(timer / 60);
		let sec = timer - min * 60;
		min = min < 10 ? '0' + min : min;
		sec = sec < 10 ? '0' + sec : sec;
		return min + ":" + sec;
	}

	static gameFinished(match) {
		return Math.floor(match.moves[match.moves.length - 1] / 10) == 0;
	}
}
