// 2D Dungeon Crawler with Levels and Enemies
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

let player = { x: 1, y: 1, color: '#0f0', hp: 3 };
let exit = { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 };
let gameOver = false;
let enemies = [];
let ENEMY_COUNT = 4;
let level = 1;
let map = [];

function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                row.push(1); // wall
            } else {
                row.push(Math.random() < 0.12 ? 1 : 0); // random wall
            }
        }
        map.push(row);
    }
    map[exit.y][exit.x] = 2; // exit
    map[player.y][player.x] = 0; // player start

    // Place enemies
    enemies = [];
    let placed = 0;
    while (placed < ENEMY_COUNT) {
        let ex = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
        let ey = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        if (map[ey][ex] === 0 && !(ex === player.x && ey === player.y) && !(ex === exit.x && ey === exit.y)) {
            enemies.push({ x: ex, y: ey, dir: Math.floor(Math.random() * 4) });
            placed++;
        }
    }
    document.getElementById('level-counter').textContent = 'Level: ' + level;
}

generateMap();

document.addEventListener('keydown', function(e) {
    if (gameOver) return;
    let dx = 0, dy = 0;
    if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
    if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
    if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
    movePlayer(dx, dy);
});

// Touch controls: swipe to move
let touchStartX = null, touchStartY = null;
canvas.addEventListener('touchstart', function(e) {
    if (gameOver) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    if (gameOver || touchStartX === null || touchStartY === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    let moveX = 0, moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) moveX = 1;
        else if (dx < -30) moveX = -1;
    } else {
        if (dy > 30) moveY = 1;
        else if (dy < -30) moveY = -1;
    }
    if (moveX !== 0 || moveY !== 0) {
        movePlayer(moveX, moveY);
    }
    touchStartX = null;
    touchStartY = null;
}, { passive: false });

function movePlayer(dx, dy) {
    let nx = player.x + dx;
    let ny = player.y + dy;
    if (map[ny][nx] === 1) return; // wall
    player.x = nx;
    player.y = ny;
    // Check collision with enemies
    for (let enemy of enemies) {
        if (enemy.x === player.x && enemy.y === player.y) {
            document.getElementById('status').textContent = 'Game Over!';
            gameOver = true;
            draw();
            return;
        }
    }
    if (map[ny][nx] === 2) {
        // Next level
        level++;
        ENEMY_COUNT = Math.ceil(ENEMY_COUNT * 1.5);
        player.x = 1;
        player.y = 1;
        document.getElementById('status').textContent = 'Level Up!';
        generateMap();
        draw();
        return;
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = '#444';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (map[y][x] === 2) {
                ctx.fillStyle = '#ff0';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    // Draw enemies
    for (let enemy of enemies) {
        ctx.save();
        ctx.translate(enemy.x * TILE_SIZE + TILE_SIZE / 2, enemy.y * TILE_SIZE + TILE_SIZE / 2);
        ctx.rotate((enemy.dir % 4) * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -TILE_SIZE / 2.2);
        ctx.lineTo(TILE_SIZE / 2.2, TILE_SIZE / 2.2);
        ctx.lineTo(-TILE_SIZE / 2.2, TILE_SIZE / 2.2);
        ctx.closePath();
        ctx.fillStyle = '#f00';
        ctx.fill();
        ctx.restore();
    }
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
        player.x * TILE_SIZE + TILE_SIZE / 2,
        player.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 2.2, 0, Math.PI * 2
    );
    ctx.fill();
}

function moveEnemies() {
    if (gameOver) return;
    for (let enemy of enemies) {
        let dirs = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];
        let dir = dirs[Math.floor(Math.random() * 4)];
        let nx = enemy.x + dir.dx;
        let ny = enemy.y + dir.dy;
        if (map[ny][nx] === 0 && !(nx === player.x && ny === player.y)) {
            enemy.x = nx;
            enemy.y = ny;
            enemy.dir = dirs.indexOf(dir);
        }
        // Check collision with player
        if (enemy.x === player.x && enemy.y === player.y) {
            document.getElementById('status').textContent = 'Game Over!';
            gameOver = true;
        }
    }
    draw();
}

draw();
document.getElementById('status').textContent = 'Find the exit!';

setInterval(moveEnemies, 500);

function restartGame() {
    player.x = 1;
    player.y = 1;
    gameOver = false;
    ENEMY_COUNT = 4;
    level = 1;
    generateMap();
    document.getElementById('status').textContent = 'Find the exit!';
    draw();
}
