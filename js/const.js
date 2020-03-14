const CANVAS_LAYER = document.getElementById("canvasLayer");

const CHESS = {King: "King", Queen: "Queen", Rook: "Rook", Bishop: "Bishop", Knight: "Knight", Pawn: "Pawn", None: "None"};
const VALUE = {King: 200, Queen: 9, Rook: 5, Bishop: 3, Knight: 3, Pawn: 1, None: 0};
const TEAM = {B: "B", W: "W", None:"N"};

const SCREEN_PORTRAIT = window.innerHeight > window.innerWidth;

const BOARD_SIZE = 8;
const GRID_SIZE_P = SCREEN_PORTRAIT ? Util.vw2px(11.5) : Util.vh2px(10);
const HIGHLIGHT_P = 3;

const COLOR_ORIGINAL = "ORIGINAL";
const COLOR_BOARD_LIGHT = "#E6BF83";
const COLOR_BOARD_DARK = "#8B4513";
const COLOR_HIGHLIGHT = "#7B68EE9A";
const COLOR_LAST_MOVE = "#FFFF99E6";

const STATUS_NONE = 0;
const STATUS_CHECKMATE = 1;
const STATUS_STALEMATE = 2;

const DB_CHECKMATE_WHITE = 0;
const DB_CHECKMATE_BLACK = 1;
const DB_STALEMATE = 2;

const STATS_MAX = 42; // treat king as 3 score

if (CANVAS_LAYER) {
	CANVAS_LAYER.width = 5 * GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.height = 5 * GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.style.width = GRID_SIZE_P * BOARD_SIZE;
	CANVAS_LAYER.style.height = GRID_SIZE_P * BOARD_SIZE;
}

const CHESS_URL = (location.hostname == "localhost") ? "" : "/web-chess"
