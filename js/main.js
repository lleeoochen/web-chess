//Main
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var board = [[],[],[],[],[],[],[],[]];

draw();
canvas.addEventListener("click", onClick, false);

function draw() {
	drawBoard();
	drawChess();
}

//Draw chess board
function drawBoard(){
	context.fillStyle = COLOR_BOARD_LIGHT;
	context.fillRect(0, 0, BOARD_SIZE * GRID_SIZE_P, BOARD_SIZE * GRID_SIZE_P); //Draw board outline

	for (var x = 0; x < BOARD_SIZE; x++) {
	    for (var y = 0; y < BOARD_SIZE; y++) {

	    	board[x][y] = new Grid(x, y);
		    if (y % 2 == 0 && x % 2 == 0 || y % 2 != 0 && x % 2 != 0) {
				context.fillStyle = COLOR_BOARD_DARK;
		    	context.fillRect(x * GRID_SIZE_P, y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P); //Draw each grid
		    }

	    }
	}
}


function drawChess() {
	//Loop through all pieces for (var i = 0; i < )

	var image = new Image();
    image.src = 'assets/BKing.svg';
    image.onload = function () {
        context.drawImage(image, 0, 0);
    };
}


//Handle mouse click
function onClick(event) {
	var x = parseInt((event.pageX - OFFSET_X_P) / GRID_SIZE_P);
	var y = parseInt((event.pageY - OFFSET_Y_P) / GRID_SIZE_P);

	if (x >= BOARD_SIZE || y >= BOARD_SIZE)
		return;

	repaint();
	highlight(x, y);
    console.log(board[x][y]);
}


//Repaint canvas
function repaint() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	draw();
}


//Highlight grid outline
function highlight(x, y) {
	context.strokeStyle = COLOR_HIGHLIGHT;
	context.lineWidth = HIGHLIGHT_P;
	context.strokeRect(x * GRID_SIZE_P, y * GRID_SIZE_P, GRID_SIZE_P, GRID_SIZE_P);
}