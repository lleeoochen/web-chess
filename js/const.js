const CHESS = {King: "King", Queen: "Queen", Rook: "Rook", Bishop: "Bishop", Knight: "Knight", Pawn: "Pawn"};
const VALUE = {King: 200, Queen: 9, Rook: 5, Bishop: 3, Knight: 3, Pawn: 1};
const TEAM = {B: "B", W: "W"}

const BOARD_SIZE = 8;
const GRID_SIZE_P = 60;
const OFFSET_X_P = document.getElementById("canvasLayer").getBoundingClientRect().left;
const OFFSET_Y_P = document.getElementById("canvasLayer").getBoundingClientRect().top;
const HIGHLIGHT_P = 3;

const COLOR_ORIGINAL = "ORIGINAL";
const COLOR_BOARD_LIGHT = "#E6BF83";
const COLOR_BOARD_DARK = "#8B4513";
const COLOR_HIGHLIGHT = "#FF56789A";