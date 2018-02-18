const CHESS = {Bishop: "Bishop", King: "King", Knight: "Knight", Pawn: "Pawn", Queen: "Queen", Rook: "Rook"};
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