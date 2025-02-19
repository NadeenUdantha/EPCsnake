
let globalGameOver = false
function Game(id, name) {
    let blockSize = 30;
    let total_row = 17; //total row number
    let total_col = 17; //total column number
    let board;
    let context;

    let snakeX = blockSize * 5;
    let snakeY = blockSize * 5;

    // Set the total number of rows and columns
    let speedX = 0;  //speed of snake in x coordinate.
    let speedY = 0;  //speed of snake in Y coordinate.

    let snakeBody = [];

    let foodX;
    let foodY;

    let gameOver = false;
    let currentFruit = {};

    let score = 0;

    this.onload = function () {
        // Set board height and width
        board = document.getElementById(id);
        board.height = total_row * blockSize;
        board.width = total_col * blockSize;
        context = board.getContext("2d");

        placeFood();
        document.addEventListener("keyup", changeDirection);  //for movements
        // Set snake speed
        let gameSpeed = 1; // Reduced from 5 to 3 for slower movement
        setInterval(update, 1000 / gameSpeed);
    }
    const self = this
    self.event = null
    function update() {
        if (gameOver) {
            return;
        }
        if (globalGameOver)
            gameOver = true
        if (self.event) {
            self.changeDirection(self.event)
            self.event = null
        }

        // Background of a Game
        context.fillStyle = "green";
        context.fillRect(0, 0, board.width, board.height);

        // Draw the current fruit
        currentFruit.render(foodX, foodY);

        if (snakeX == foodX && snakeY == foodY) {
            snakeBody.push([foodX, foodY]);
            score += currentFruit.points;
            if (self.game2.gameOver && self.game2.score < score) {
                globalGameOver = true
                alert('Game Over')
                //try { ws.send(score + '') } catch (e) { }
                client.publish('snake/highscore', score + '', { retain: true });
            }
            placeFood();
        }

        // body of snake will grow
        for (let i = snakeBody.length - 1; i > 0; i--) {
            snakeBody[i] = snakeBody[i - 1];
        }
        if (snakeBody.length) {
            snakeBody[0] = [snakeX, snakeY];
        }

        context.fillStyle = "lightgreen";
        snakeX += speedX * blockSize;
        snakeY += speedY * blockSize;

        // Handle border wrapping
        if (snakeX < 0) {
            snakeX = total_col * blockSize - blockSize;
        } else if (snakeX >= total_col * blockSize) {
            snakeX = 0;
        }

        if (snakeY < 0) {
            snakeY = total_row * blockSize - blockSize;
        } else if (snakeY >= total_row * blockSize) {
            snakeY = 0;
        }

        // Draw snake head
        context.beginPath();
        context.arc(snakeX + blockSize / 2, snakeY + blockSize / 2, blockSize / 2, 0, 2 * Math.PI);
        context.fill();

        // Draw eyes
        context.fillStyle = "black";
        let eyeSize = blockSize / 8;

        // Position eyes based on direction
        let leftEyeX = snakeX + blockSize / 3;
        let rightEyeX = snakeX + 2 * blockSize / 3;
        let leftEyeY = snakeY + blockSize / 3;
        let rightEyeY = snakeY + blockSize / 3;

        if (speedX === 1) { // moving right
            leftEyeY = rightEyeY = snakeY + blockSize / 3;
        } else if (speedX === -1) { // moving left
            leftEyeY = rightEyeY = snakeY + blockSize / 3;
        } else if (speedY === -1) { // moving up
            leftEyeX = snakeX + blockSize / 3;
            rightEyeX = snakeX + 2 * blockSize / 3;
            leftEyeY = rightEyeY = snakeY + blockSize / 4;
        } else if (speedY === 1) { // moving down
            leftEyeX = snakeX + blockSize / 3;
            rightEyeX = snakeX + 2 * blockSize / 3;
            leftEyeY = rightEyeY = snakeY + blockSize / 2;
        }

        context.beginPath();
        context.arc(leftEyeX, leftEyeY, eyeSize, 0, 2 * Math.PI);
        context.arc(rightEyeX, rightEyeY, eyeSize, 0, 2 * Math.PI);
        context.fill();

        // Draw snake body segments
        context.fillStyle = "lightgreen";
        for (let i = 0; i < snakeBody.length; i++) {
            context.beginPath();
            context.arc(
                snakeBody[i][0] + blockSize / 2,
                snakeBody[i][1] + blockSize / 2,
                blockSize / 2 - 1, // Slightly smaller than head
                0,
                2 * Math.PI
            );
            context.fill();
        }

        self.score = score
        // Check only for self collision
        for (let i = 0; i < snakeBody.length; i++) {
            if (snakeX == snakeBody[i][0] && snakeY == snakeBody[i][1]) {
                gameOver = true;
            }
        }
        self.gameOver = gameOver

        // Display score
        context.fillStyle = "white";
        context.font = "20px Arial";
        let str = name + " Score: " + score
        if (gameOver)
            str += " Game Over"
        context.fillText(str, 10, 30);
    }

    // Movement of the Snake - We are using addEventListener
    function changeDirection(e) {
        // Store current direction before change
        let currentDirection = {
            x: speedX,
            y: speedY
        };

        // If no current direction (game start), initialize moving right
        if (speedX === 0 && speedY === 0) {
            speedX = 1;
            speedY = 0;
            return;
        }

        if (e.code == "ArrowRight") {
            // Turn 90 degrees right relative to current direction
            if (currentDirection.x === 0) {
                // If moving vertically, turn right
                speedX = -currentDirection.y;
                speedY = 0;
            } else {
                // If moving horizontally, turn right
                speedX = 0;
                speedY = currentDirection.x;
            }
        }
        else if (e.code == "ArrowLeft") {
            // Turn 90 degrees left relative to current direction
            if (currentDirection.x === 0) {
                // If moving vertically, turn left
                speedX = currentDirection.y;
                speedY = 0;
            } else {
                // If moving horizontally, turn left
                speedX = 0;
                speedY = -currentDirection.x;
            }
        }
    }
    this.changeDirection = changeDirection

    // Randomly place food
    function placeFood() {
        foodX = Math.floor(Math.random() * total_col) * blockSize;
        foodY = Math.floor(Math.random() * total_row) * blockSize;

        // Randomly select a fruit type
        const fruitTypes = ['apple', 'banana', 'strawberry'];
        const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        currentFruit = createFruit(randomType);
    }

    function createFruit(type) {
        const fruits = {
            apple: {
                color: "#ff0000",
                points: 1,
                render: function (x, y) {
                    // Apple body
                    context.fillStyle = this.color;
                    context.beginPath();
                    context.arc(x + blockSize / 2, y + blockSize / 2, blockSize / 2 - 2, 0, 2 * Math.PI);
                    context.fill();

                    // Leaf
                    context.fillStyle = "#2d5e1e";
                    context.beginPath();
                    context.ellipse(x + blockSize / 2 + 2, y + blockSize / 4,
                        blockSize / 6, blockSize / 8, Math.PI / 4, 0, 2 * Math.PI);
                    context.fill();
                }
            },
            banana: {
                color: "#ffd700",
                points: 2,
                render: function (x, y) {
                    context.fillStyle = this.color;
                    context.beginPath();
                    context.ellipse(x + blockSize / 2, y + blockSize / 2,
                        blockSize / 2 - 2, blockSize / 4, Math.PI / 4, 0, 2 * Math.PI);
                    context.fill();
                }
            },
            strawberry: {
                color: "#ff2d55",
                points: 3,
                render: function (x, y) {
                    // Berry body
                    context.fillStyle = this.color;
                    context.beginPath();
                    context.moveTo(x + blockSize / 2, y + blockSize / 4);
                    context.bezierCurveTo(
                        x + blockSize, y + blockSize / 4,
                        x + blockSize, y + blockSize,
                        x + blockSize / 2, y + blockSize
                    );
                    context.bezierCurveTo(
                        x, y + blockSize,
                        x, y + blockSize / 4,
                        x + blockSize / 2, y + blockSize / 4
                    );
                    context.fill();

                    // Seeds
                    context.fillStyle = "#ffff00";
                    for (let i = 0; i < 5; i++) {
                        context.beginPath();
                        context.arc(
                            x + blockSize / 3 + Math.random() * blockSize / 3,
                            y + blockSize / 2 + Math.random() * blockSize / 3,
                            1, 0, 2 * Math.PI
                        );
                        context.fill();
                    }
                }
            }
        };
        return fruits[type] || fruits.apple;
    }
}

const gameA = new Game('boardA', "Player A")
const gameB = new Game('boardB', "Player B")
gameA.game2 = gameB
gameB.game2 = gameA
gameA.onload()
gameB.onload()

let ws2
const connect = () => {
    const ws = new WebSocket('ws://192.168.237.173/ws')
    ws.onmessage = event => {
        let [b, a] = event.data.split(',').map(x => parseFloat(x)).map(x => Math.min(30, x))
        console.log({ a, b })
        const evt = (x, game) => {
            if (x > 5 && x < 10) {
                game.event = { code: "ArrowLeft" }
            }
            else if (x > 20 && x < 28) {
                game.event = { code: "ArrowRight" }
            }
            else
                game.event = null
        }
        evt(a, gameA)
        evt(b, gameB)
    }
    let ws3 = ws2
    ws2 = ws
    ws.onopen = () => {
        //try { ws.send('lol') } catch (e) { }
        ws3.close()
    }
}
connect()
setInterval(connect, 500)

// connection options:
let options = {
    // Clean session
    clean: true,
    // connect timeout in ms:
    connectTimeout: 10000,
    // Authentication
    // add a random number for a unique client ID:
    clientId: 'mqttJsClient-' + Math.floor(Math.random() * 1000000),
    // add these in for public.cloud.shiftr.io:
    username: 'epcGroup8',
    password: 'EPCsnake@123'
}
let client = mqtt.connect("wss://0389f361cc4b4d3fb47160ad8f1b5353.s1.eu.hivemq.cloud:8884/mqtt", options)

client.on('connect', function () {
    console.log('onConnect', arguments)
    //client.publish('snake/highscore', '0', { retain: true })
    client.subscribe('snake/highscore', function () {
        console.log('onSubscribe', arguments)
    });
});
client.on('close', function () {
    console.log('onDisconnect', arguments)
});
client.on('message', function (topic, payload, packet) {
    console.log('onMessage', arguments)
    document.getElementById('hs').innerText = 'High Score: ' + payload.toString()
});
client.on('error', function () {
    console.log('onError', arguments)
});

