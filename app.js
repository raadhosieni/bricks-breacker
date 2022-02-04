const myCanvas = document.getElementById('myCanvas');
const context = myCanvas.getContext('2d');


//Constants
const HEIGHT = myCanvas.clientHeight;
const WIDTH = myCanvas.clientWidth;
const LEVELS = [2, 4]; //[2, 4, 6, 8, 10]
const PEDDAL_INIT_X = WIDTH / 2;
const PEDDAL_INIT_Y = HEIGHT - 12;
const BALL_INIT_X = PEDDAL_INIT_X;
const BALL_INIT_Y = PEDDAL_INIT_Y - 12;
const LIFES = 3;
const TEXT_SHOW_PERIOD = 2000; // 3000 milliseconds 

//game variables
let gameState;
let current_level = 0;
let myLifes = LIFES;
let current_show_period, alpha;
let score = 0, highScore = localStorage.getItem('highScore') || 0;
let sounds = {
    ball_hit_ojects: new Audio('./sound-effects/ball_tap.wav')
}

//this function draw current number of lifes on the context
function drawLifes() {
    for(let i = 0; i < myLifes; i++) {
        context.fillStyle = "#fff";
        context.beginPath();
        context.arc(i * 20 + 10, 10, 4, 0, Math.PI * 2);
        context.fill();
    }
}

//draw the current score
function drawScore() {
    context.fillStyle = "#fff";
    context.font = "15px Arial";
    context.fillText("SCORE: " + score.toString(), WIDTH - 200, 40);
    context.fill();
}

//draw the current high score
function drawHighScore() {
    context.fillStyle = "#fff";
    context.font = "15px Arial";
    context.fillText("HIGH SCORE: " + highScore.toString(), WIDTH - 200, 20);
    context.fill();
}

//update score
function updateScore() {
    score += 10;
    if (highScore < score) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
}


//Peddal
const PEDDAL_WIDTH = WIDTH / 5;
const PEDDAL_SPEED = 10;
const peddal = {
    x: PEDDAL_INIT_X,
    y: PEDDAL_INIT_Y,
    w: PEDDAL_WIDTH,
    h: 10,
    speed: PEDDAL_SPEED,
    magnitPeddal: true,
    isPeddalMove: 0,
    draw() {
        context.fillStyle = "#fff";
        context.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    },
    move(direction) {
        if(direction === 'left') {
            if(this.x - this.w / 2 > 0) {
                this.x -= this.speed;
            }
        } else {
            if(this.x + this.w / 2 < WIDTH) {
                this.x += this.speed;
            }
        }
    }
}

//Ball 
const ball = {
    radius: 6,
    x: BALL_INIT_X,
    y: BALL_INIT_Y,
    xspeed: 0,
    yspeed: -5,
    draw() {
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    },
    move() {
        this.x += this.xspeed;
        this.y += this.yspeed;
    },
    detectAreaBounding() {
        if(this.x + this.radius >= WIDTH || this.x - this.radius <= 0) {
            this.xspeed = -this.xspeed;  
        }

        if(this.y - this.radius <= 0) {
            this.yspeed = -this.yspeed;
        }

            if (this.y + this.radius > HEIGHT) {
                myLifes--;
                continueCurrentLevel();
            }
    },
    detectBounding(obj) {    
        if(this.y + this.radius > obj.y - obj.h / 2 
            && this.y - this.radius < obj.y + obj.h / 2
            && this.x - this.radius < obj.x + obj.w / 2 
            && this.x + this.radius > obj.x - obj.w / 2) {
            this.yspeed = -this.yspeed;
            this.xspeed = this.xspeed + Math.random() * 2 - 1;
            sounds.ball_hit_ojects.play();
            if(obj instanceof Brick) {
                obj.remove = true;
                updateScore();
            }
        }
    }
}

//Brick
const BRICKS_IN_ROW = 10;
const BRICK_ROW_GAP = 3;
const BRICK_COLUMN_GAP = 3;
const BRICK_WIDTH = ((WIDTH - 20) / BRICKS_IN_ROW - BRICK_ROW_GAP);
const BRICK_HEIGHT = BRICK_WIDTH / 3;

class Brick {
    constructor(x, y, w = BRICK_WIDTH, h = BRICK_HEIGHT) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.remove = false;
        this.color = "#fff"
    }

    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    }

    changeColor(color) {
        this.color = color;
    }
}

let hex = "123456789abcdef";

function generateRandomColor() {
    let color = "#";
    for(let i = 0; i < 6; i++) {
        let rIndex = Math.floor(Math.random() * hex.length);
        color += hex[rIndex];
    }
    return color;
}

//Bricks
function generateBricks(current_level) {
    const bricks = [];
    const rows = LEVELS[current_level];
    for (let i = 0; i < BRICKS_IN_ROW; i++) {
        for(let j = 0; j < rows; j++) {
            let brick = new Brick( i * (BRICK_WIDTH + BRICK_ROW_GAP) + (WIDTH / 16), j * (BRICK_HEIGHT + BRICK_COLUMN_GAP) + 70);
            brick.changeColor(generateRandomColor());
            bricks.push(brick);
        }   
    }
    return bricks;
}

let bricks = generateBricks(current_level);


//Event Management

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        peddal.isPeddalMove = -1;
    } else if (e.key === 'ArrowRight') {
        peddal.isPeddalMove = 1;
    } 
    
    if(e.keyCode === 32) {
        peddal.magnitPeddal = false;
    }
})

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        peddal.isPeddalMove = 0;
    } 
})


//initialize game
function initGame() {
    //init variables
    if(gameState === undefined) {
        gameState = "start";
    } else {
        gameState = "running";
    }
    current_level = 0;
    myLifes = LIFES;
    current_show_period = TEXT_SHOW_PERIOD;
    alpha = 1;
    score = 0;
    highScore = localStorage.getItem('highScore');
    
    //init peddal
    peddal.x = PEDDAL_INIT_X;
    peddal.y = PEDDAL_INIT_Y;
    peddal.magnitPeddal = true;

    //init ball
    ball.x = BALL_INIT_X;
    ball.y = BALL_INIT_Y;

    //init bricks
    bricks = generateBricks(current_level);
}

//initialize level
function initLevel() {
    //init variables
    current_show_period = TEXT_SHOW_PERIOD;
    gameState = "running";
    alpha = 1;

    //init peddal
    peddal.x = PEDDAL_INIT_X;
    peddal.y = PEDDAL_INIT_Y;
    peddal.magnitPeddal = true;

    //init ball
    ball.x = BALL_INIT_X;
    ball.y = BALL_INIT_Y;

    //init bricks
    bricks = generateBricks(current_level);
}

//continue current level
function continueCurrentLevel() {
    //init peddal
    peddal.x = PEDDAL_INIT_X;
    peddal.y = PEDDAL_INIT_Y;
    peddal.magnitPeddal = true;

    //init ball
    ball.x = BALL_INIT_X;
    ball.y = BALL_INIT_Y;
    ball.xspeed = 0;
}

/* Helper function
show specefied text
*/
function showText(text) {
    context.font = "30px Arial";
    context.fillStyle = "rgba(255, 255, 255, " + (alpha -= (1 / (TEXT_SHOW_PERIOD / 20))) + ")";
    context.textAlign = "center";
    context.fillText(text, WIDTH / 2, HEIGHT / 2);
}

function manageCurrentGameState(diff) {
    let text;
    switch(gameState) {
        case "gameOver":
            text = "GAME OVER";
            break;
        case "win":
            text = "YOU WIN";
            break;
        case "next":
            text = "LEVEL NO: " + (current_level + 1);
            break;
        case "start":
            text = "Start";
            break;
        default:
            text = "Some thing went wrong";
            break;
    }
    if(current_show_period > 0) {
        showText(text);
        current_show_period -= diff;
    } else {
        if(gameState === "win" || gameState === "gameOver" || gameState === "start") {
            initGame();
        }
        else {// game state is next
            initLevel();
        }
    }
}

//draw screen
function drawScreen() {
    //Draw peddal
    peddal.draw();

    //Draw ball
    ball.draw();

    //Draw bricks
    bricks.forEach((brick, i) => {
        brick.draw();
        
        if(brick.remove) {
            bricks.splice(i, 1);
        }
    });

    //draw the current number of lifes
    drawLifes();

    //draw current score
    drawScore();

    //draw high score
    drawHighScore();
}


let prevTime;
function gameLoop(t) {
    //calculate frame time 
    if (prevTime === undefined) {
        prevTime = t;
    }
    let newTime = t;
    let diff = newTime - prevTime;
    prevTime = newTime;
    context.fillStyle = "black";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'start') {
        manageCurrentGameState(diff);
        drawScreen();
    } else if(gameState === 'running') {
        drawScreen();

        //Move peddal
        if(peddal.isPeddalMove === -1) {
            peddal.move('left')
        } else if (peddal.isPeddalMove === 1) {
            peddal.move('right')
        } 

        if(!peddal.magnitPeddal) {
            //Move ball
            ball.move();

            //Manage bounding
            ball.detectBounding(peddal);
            bricks.forEach(brick => {
                ball.detectBounding(brick);
            })
            ball.detectAreaBounding();
        } else {
            ball.x = peddal.x;
        }
        

        //when hit all bricks go to next level
        if(bricks.length === 0) {
            if(current_level < LEVELS.length - 1) {
                //set game state to next 
                gameState = "next";
                
                //increase level by one
                current_level++;
            } else {
                //set game state to you win
                gameState = "win";
            }   
        } 
        
        //when lifes finish
        if(myLifes === 0) {
            gameState = "gameOver";
        }
    } else if (gameState === 'win') {
        //you win
        manageCurrentGameState(diff);
        drawScreen();

    } else if (gameState === 'gameOver') {
        //game over
        manageCurrentGameState(diff);
        drawScreen();
    } else if (gameState = "next") {
        //next level
        manageCurrentGameState(diff);
        drawScreen();
    }
    
    requestAnimationFrame(gameLoop);
}



requestAnimationFrame(gameLoop);

