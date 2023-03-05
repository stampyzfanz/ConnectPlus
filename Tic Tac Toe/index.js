const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const winConditions = [
    //each 1D array represents the cells that must be the same for a win condition
    //e.g. cells of index 0, 1 and 2 being the same is one such condition
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
//array to keep track of what is in each cell
let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;

initialiseGame();

function initialiseGame() {
    cells.forEach(cell => cell.addEventListener("click", cellClicked));
    restartBtn.addEventListener("click", restartGame);
    statusText.textContent = `${currentPlayer}'s turn`;
    if (currentPlayer === "X") {
        statusText.style.color = "#7a9cff";
    } else {
        statusText.style.color = "#ff7a7a";
    }
    running = true;
}

function cellClicked() {
    const cellIndex = this.getAttribute("cellIndex");

    //returns if the cell clicked is not empty of if running is false
    if (options[cellIndex] != "" || !running) {
        return;
    }

    updateCell(this, cellIndex);
    checkWinner();

    if (currentPlayer === "X") {
        statusText.style.color = "#7a9cff";
    } else {
        statusText.style.color = "#ff7a7a";
    }
}

function updateCell(cell, index) {
    options[index] = currentPlayer;
    cell.textContent = currentPlayer;
    if (currentPlayer == "X") {
        cell.style.color = "#7a9cff";
    } else {
        cell.style.color = "#ff7a7a";
    }
}

function changePlayer() {
    if (currentPlayer == "X") {
        currentPlayer = "O";
    } else {
        currentPlayer = "X";
    }
    statusText.textContent = `${currentPlayer}'s turn`;
    if (currentPlayer === "X") {
        statusText.style.color = "#7a9cff";
    } else {
        statusText.style.color = "#ff7a7a";
    }
}

function checkWinner() {
    let roundWon = false;

    //checks every single condition in the winConditions array
    for (let i = 0; i < winConditions.length; i++) {
        const condition = winConditions[i];
        const cellA = options[condition[0]];    //contents of the 1st cell in a particular win condition
        const cellB = options[condition[1]];    //contents of the 2nd cell in a particular win condition
        const cellC = options[condition[2]];    //contents of the 3rd cell in a particular win condition

        //if no cells are filled at all
        if (cellA == "" || cellB == "" || cellC == "") {
            continue;
        }

        //if all 3 cells are the same
        if (cellA == cellB && cellB == cellC) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = `${currentPlayer} wins!`
        running = false;
        window.top.postMessage({
            winner: currentPlayer === "X" ? 0 : 1,
            sender: "minigame"
        }, '*');
    }
    //if all cells are full and the win condition is not met
    else if (!options.includes("")) {
        statusText.textContent = `Draw!`;
        restartBtn.style.visibility = "visible";
        running = false;
    } else {
        changePlayer();
    }
}

function restartGame() {
    currentPlayer = "X"
    options = ["", "", "", "", "", "", "", "", ""];
    statusText.textContent = `${currentPlayer}'s turn`;
    if (currentPlayer === "X") {
        statusText.style.color = "#7a9cff";
    } else {
        statusText.style.color = "#ff7a7a";
    }
    cells.forEach(cell => cell.textContent = "");
    restartBtn.style.visibility = "hidden";
    running = true;
}

//Acknowledgement: https://www.youtube.com/watch?v=AnmwHjpEhtA