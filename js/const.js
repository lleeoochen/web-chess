const CHESS = {King: "King", Queen: "Queen", Rook: "Rook", Bishop: "Bishop", Knight: "Knight", Pawn: "Pawn", None: "None"};
const VALUE = {King: 200, Queen: 9, Rook: 5, Bishop: 3, Knight: 3, Pawn: 1, None: 0};
const TEAM = {B: "B", W: "W", None:"N"}

const BOARD_SIZE = 8;
const GRID_SIZE_P = 60;
const OFFSET_MARGIN = 18;

const OFFSET_X_P = document.getElementById("canvasLayer") ? document.getElementById("canvasLayer").getBoundingClientRect().left + OFFSET_MARGIN : 0;
const OFFSET_Y_P = document.getElementById("canvasLayer") ? document.getElementById("canvasLayer").getBoundingClientRect().top + OFFSET_MARGIN : 0;

const HIGHLIGHT_P = 3;

const COLOR_ORIGINAL = "ORIGINAL";
const COLOR_BOARD_LIGHT = "#E6BF83";
const COLOR_BOARD_DARK = "#8B4513";
const COLOR_HIGHLIGHT = "#7B68EE9A";
