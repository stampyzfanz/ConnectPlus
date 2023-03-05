const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "#190021";
const paddle1Colour = "#FF8686";
const paddle2Colour = "#86D2FF";
const ballColour = "white";
const ballRadius = 12.5;
const paddleSpeed = 4.5;

let intervalID;
let ballSpeed = 1;
let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballXDirection = 0;
let ballYDirection = 0;
let player1Score = 0;
let player2Score = 0;

let paddle1 = {
    width: 25,
    height: 100,
    x: 0,
    y: 0
};

let paddle2 = {
    width: 25,
    height: 100,
    x: gameWidth - 25,
    y: gameHeight - 100
};

let paddle1Direction = 0;
let paddle2Direction = 0;

let hasGameStarted = false;

window.addEventListener("keydown", (event) => {
    const isValidControl = ["w", "s", "ArrowUp", "ArrowDown"].includes(event.key);
    if (!hasGameStarted && isValidControl) {
        hasGameStarted = true;
        gameStart();
    }

    switch (event.key) {
        case "w":
            paddle1Direction = 1;
            break;
        case "s":
            paddle1Direction = -1;
            break;
        case "ArrowUp":
            paddle2Direction = 1;
            break;
        case "ArrowDown":
            paddle2Direction = -1;
            break;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key === "w" && paddle1Direction === 1) {
        paddle1Direction = 0;
    } else if (event.key === "s" && paddle1Direction === -1) {
        paddle1Direction = 0;
    } else if (event.key === "ArrowUp" && paddle2Direction === 1) {
        paddle2Direction = 0;
    } else if (event.key === "ArrowDown" && paddle1Direction === -1) {
        paddle2Direction = 0;
    }
});

function gameStart() {

    createBall();
    nextTick();

}

//updates the canvas every 10ms
function nextTick() {

    intervalID = setInterval(() => {
        drawBoard();
        movePaddles();
        drawPaddles();
        moveBall();
        drawBall(ballX, ballY);
        checkCollision();
    }, 10)

}

//draws the background of the board
function drawBoard() {

    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

}

function movePaddles() {
    if (paddle1Direction === 1 && paddle1.y > 0) {
        paddle1.y -= paddleSpeed;
    } else if (paddle1Direction === -1 && paddle1.y < gameHeight - paddle1.height) {
        paddle1.y += paddleSpeed;
    }

    if (paddle2Direction === 1 && paddle2.y > 0) {
        paddle2.y -= paddleSpeed;
    } else if (paddle2Direction === -1 && paddle2.y < gameHeight - paddle2.height) {
        paddle2.y += paddleSpeed;
    }
}

function drawPaddles() {

    ctx.fillStyle = paddle1Colour;
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.strokeRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);

    ctx.fillStyle = paddle2Colour;
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    ctx.strokeRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

}

//creates a ball in the centre and makes it move in a random direction
function createBall() {
    if (player1Score >= 3 || player2Score >= 3) {
        clearInterval(intervalID);
        window.top.postMessage({
            winner: player2Score >= 3 ? 1 : 0,
            sender: "minigame"
        }, '*');
    } else {
        ballSpeed = 2.5;
        if (Math.round(Math.random()) == 1) {
            ballXDirection = 1;
        } else {
            ballXDirection = -1;
        }
        if (Math.round(Math.random()) == 1) {
            ballYDirection = Math.random() * 1; //more random directions
        } else {
            ballYDirection = Math.random() * -1; //more random directions
        }
        ballX = gameWidth / 2;
        ballY = gameHeight / 2;
        drawBall(ballX, ballY);
    }
}

function moveBall() {
    ballX += (ballSpeed * ballXDirection);
    ballY += (ballSpeed * ballYDirection);
}

function drawBall(ballX, ballY) {

    ctx.fillStyle = ballColour;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.fill();

}

function checkCollision() {

    //deflects ball if it hits the top or bottom wall
    if (ballY <= 0 + ballRadius) {
        ballYDirection *= -1;
    }
    if (ballY >= gameHeight - ballRadius) {
        ballYDirection *= -1;
    }

    //updates the score each player if they win the round
    if (ballX <= 0) {
        player2Score += 1;
        updateScore();
        createBall();
        return;
    }
    if (ballX >= gameWidth) {
        player1Score += 1;
        updateScore();
        createBall();
        return;
    }

    //stops the ball from getting stuck
    if (ballX <= (paddle1.x + paddle1.width + ballRadius)) {
        if (ballY > paddle1.y && ballY < paddle1.y + paddle1.height) {
            ballX = (paddle1.x + paddle1.width) + ballRadius; // if ball gets stuck
            ballXDirection *= -1;
            ballSpeed *= 1.1;
        }
    }
    if (ballX >= (paddle2.x - ballRadius)) {
        if (ballY > paddle2.y && ballY < paddle2.y + paddle2.height) {
            ballX = paddle2.x - ballRadius; // if ball gets stuck
            ballXDirection *= -1;
            ballSpeed *= 1.1;
        }
    }
}

function updateScore() {
    scoreText.textContent = `${player1Score} : ${player2Score}`;
}

drawBoard();
drawPaddles();
drawBall(ballX, ballY);

//Acknowledgement: https://www.youtube.com/watch?v=AiFqApeurqI