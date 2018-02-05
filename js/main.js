//Main
var board = document.getElementById("board");
var context = board.getContext("2d");
drawBoard();


//Draw chess board
function drawBoard(){
	for (var x = 0; x < BOARD_SIZE; x++)
	    for (var y = 0; y < BOARD_SIZE; y++)
		    if (y % 2 == 0 && x % 2 == 0 || y % 2 != 0 && x % 2 != 0)
		    	context.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE); //Draw each grid
	
	context.rect(0, 0, BOARD_SIZE * GRID_SIZE, BOARD_SIZE * GRID_SIZE); //Draw board outline
	context.strokeStyle = "black";
	context.stroke();
	board.addEventListener("click", onClick, false);
}


//Handle mouse click
function onClick(event) {
    alert("You clicked on (" + event.pageX + ", " + event.pageY + ")");
}