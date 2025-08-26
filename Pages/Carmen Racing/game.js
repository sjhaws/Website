// Carmen Racing - 8 Bit Classic
// Simple 2D top-down endless racer

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Game constants
const ROAD_W = 120;
const ROAD_X = (W - ROAD_W) / 2;
const LANE_W = ROAD_W / 3;
const CAR_W = 24, CAR_H = 32;
const OBSTACLE_W = 24, OBSTACLE_H = 32;
const FLAG_W = 16, FLAG_H = 16;
const FPS = 60;

// Sprites (8-bit style, simple shapes/colors)
function drawCar(x, y, color = '#fff600') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, CAR_W, CAR_H);
    ctx.fillStyle = '#ff00c8';
    ctx.fillRect(x + 4, y + 4, CAR_W - 8, CAR_H - 8);
}
function drawObstacle(x, y) {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(x, y, OBSTACLE_W, OBSTACLE_H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6, y + 8, OBSTACLE_W - 12, OBSTACLE_H - 16);
}
function drawFlag(x, y) {
    ctx.fillStyle = '#00fff7';
    ctx.fillRect(x, y, FLAG_W, FLAG_H);
    ctx.fillStyle = '#fff600';
    ctx.fillRect(x + 4, y + 4, 8, 8);
}

// Game state
let player = { lane: 1, y: H - CAR_H - 12, speed: 4, alive: true, score: 0 };
let obstacles = [];
let flags = [];
let frame = 0;
let gameOver = false;
let started = false;

function resetGame() {
    player.lane = 1;
    player.y = H - CAR_H - 12;
    player.speed = 4;
    player.alive = true;
    player.score = 0;
    obstacles = [];
    flags = [];
    frame = 0;
    gameOver = false;
    started = false;
    document.getElementById('restartBtn').style.display = 'none';
    draw();
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    obstacles.push({ lane, y: -OBSTACLE_H });
}
function spawnFlag() {
    const lane = Math.floor(Math.random() * 3);
    flags.push({ lane, y: -FLAG_H });
}

function update() {
    if (!player.alive || !started) return;
    frame++;
    // Move obstacles
    for (const obs of obstacles) obs.y += player.speed;
    for (const flag of flags) flag.y += player.speed;
    // Remove off-screen
    obstacles = obstacles.filter(o => o.y < H);
    flags = flags.filter(f => f.y < H);
    // Spawn new
    if (frame % 60 === 0) spawnObstacle();
    if (frame % 90 === 0) spawnFlag();
    // Collisions
    for (const obs of obstacles) {
        if (obs.lane === player.lane && obs.y + OBSTACLE_H > player.y && obs.y < player.y + CAR_H) {
            player.alive = false;
            gameOver = true;
            document.getElementById('restartBtn').style.display = 'block';
        }
    }
    for (let i = flags.length - 1; i >= 0; i--) {
        const flag = flags[i];
        if (flag.lane === player.lane && flag.y + FLAG_H > player.y && flag.y < player.y + CAR_H) {
            player.score++;
            flags.splice(i, 1);
        }
    }
    // Speed up
    if (frame % 180 === 0 && player.speed < 12) player.speed += 0.5;
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    // Draw road
    ctx.fillStyle = '#444';
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    // Lane lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(ROAD_X + i * LANE_W, 0);
        ctx.lineTo(ROAD_X + i * LANE_W, H);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    // Draw flags
    for (const flag of flags) {
        drawFlag(ROAD_X + flag.lane * LANE_W + (LANE_W - FLAG_W) / 2, flag.y);
    }
    // Draw obstacles
    for (const obs of obstacles) {
        drawObstacle(ROAD_X + obs.lane * LANE_W + (LANE_W - OBSTACLE_W) / 2, obs.y);
    }
    // Draw car
    drawCar(ROAD_X + player.lane * LANE_W + (LANE_W - CAR_W) / 2, player.y);
    // Score
    ctx.fillStyle = '#fff600';
    ctx.font = '16px "Press Start 2P", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + player.score, 12, 28);
    // Game over
    if (gameOver) {
        ctx.fillStyle = '#ff00c8';
        ctx.font = '20px "Press Start 2P", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
        ctx.font = '12px "Press Start 2P", Arial, sans-serif';
        ctx.fillStyle = '#fff600';
        ctx.fillText('Press Space or Restart', W / 2, H / 2 + 20);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (!player.alive && (e.key === ' ' || e.key === 'Spacebar')) {
        resetGame();
        started = true;
        return;
    }
    if (!started && (e.key === ' ' || e.key === 'Spacebar')) {
        started = true;
        return;
    }
    if (!player.alive) return;
    if (e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
    if (e.key === 'ArrowRight' && player.lane < 2) player.lane++;
});

document.getElementById('restartBtn').onclick = () => {
    resetGame();
    started = true;
};

resetGame();
gameLoop();
