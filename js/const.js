const CANVAS_LAYER = document.getElementById("canvas-layer");
const CHESS_URL = (location.hostname == "localhost") ? "" : "/web-chess"

const CHESS = {King: "King", Queen: "Queen", Rook: "Rook", Bishop: "Bishop", Knight: "Knight", Pawn: "Pawn", None: "None"};
const VALUE = {King: 200, Queen: 9, Rook: 5, Bishop: 3, Knight: 3, Pawn: 1, None: 0};
const TEAM = {B: "B", W: "W", None:"N"};

const SCREEN_PORTRAIT = window.innerHeight > window.innerWidth;

const BOARD_SIZE = 8;
const GRID_SIZE_P = SCREEN_PORTRAIT ? Util.vw2px(11.5) : Util.vh2px(10);
const HIGHLIGHT_P = 3;

const MATCHES_TABLE = "matches";
const USERS_TABLE = "users";

const THEME_CLASSIC = {
	COLOR_BOARD_LIGHT: 		"#E6BF83",
	COLOR_BOARD_DARK: 		"#8B4513",
	COLOR_HIGHLIGHT_LIGHT: 	"#9e93e1",
	COLOR_HIGHLIGHT_DARK: 	"#7B68EE",
	COLOR_LAST_MOVE_LIGHT: 	"#FDFD84",
	COLOR_LAST_MOVE_DARK: 	"#EFEF6E",
	BACKGROUND_IMAGE: 		"./assets/background.jpg",
	NAME_TITLE_COLOR: 		"white"
};

const THEME_WINTER = {
	COLOR_BOARD_LIGHT: 		"#00B3DE",
	COLOR_BOARD_DARK: 		"#3D507B",
	COLOR_HIGHLIGHT_LIGHT: 	"#9e93e1",
	COLOR_HIGHLIGHT_DARK: 	"#7B68EE",
	COLOR_LAST_MOVE_LIGHT: 	"#FDFD84",
	COLOR_LAST_MOVE_DARK: 	"#EFEF6E",
	BACKGROUND_IMAGE: 		"./assets/background_winter.jpg",
	NAME_TITLE_COLOR: 		"white"
};

const THEME_METAL = {
	COLOR_BOARD_LIGHT: 		"#d2d2d2",
	COLOR_BOARD_DARK: 		"#5a5858",
	COLOR_HIGHLIGHT_LIGHT: 	"#9e93e1",
	COLOR_HIGHLIGHT_DARK: 	"#7B68EE",
	COLOR_LAST_MOVE_LIGHT: 	"#FDFD84",
	COLOR_LAST_MOVE_DARK: 	"#EFEF6E",
	BACKGROUND_IMAGE: 		"./assets/background_metal.jpg",
	NAME_TITLE_COLOR: 		"white"
};

const THEME_NATURE = {
	COLOR_BOARD_LIGHT: 		"#c7da61",
	COLOR_BOARD_DARK: 		"#437149",
	COLOR_HIGHLIGHT_LIGHT: 	"#9e93e1",
	COLOR_HIGHLIGHT_DARK: 	"#7B68EE",
	COLOR_LAST_MOVE_LIGHT: 	"#FDFD84",
	COLOR_LAST_MOVE_DARK: 	"#EFEF6E",
	BACKGROUND_IMAGE: 		"./assets/background_nature.jpg",
	NAME_TITLE_COLOR: 		"black"
};

const COLOR_ORIGINAL = 0;
const COLOR_HIGHLIGHT = 1;
const COLOR_LAST_MOVE = 2;

const STATUS_NONE = 0;
const STATUS_CHECKMATE = 1;
const STATUS_STALEMATE = 2;

const DB_CHECKMATE_WHITE = 0;
const DB_CHECKMATE_BLACK = 1;
const DB_STALEMATE = 2;
const DB_TIMESUP_WHITE = 3;
const DB_TIMESUP_BLACK = 4;
const DB_RESIGN_WHITE = 5;
const DB_RESIGN_BLACK = 6;
const DB_DRAW = 7;

const DB_REQUEST_NONE = 0;
const DB_REQUEST_ASK = 1;
const DB_REQUEST_DONE = 2;

const DB_THEME_CLASSIC = 0;
const DB_THEME_WINTER = 1;
const DB_THEME_METAL = 2;
const DB_THEME_NATURE = 3;

const MAX_TIME = 15 * 60; // 15 min in seconds

const STATS_MAX = 42; // treat king as 3 score

if (CANVAS_LAYER) {
	CANVAS_LAYER.width = 5 * GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.height = 5 * GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.style.width = GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.style.height = GRID_SIZE_P * BOARD_SIZE;
}
