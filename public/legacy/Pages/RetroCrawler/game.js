// 2D Dungeon Crawler with Levels and Enemies
//
// start(container) builds the game inside `container` and returns stop(),
// which removes everything the game added: elements, listeners and timers.

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

export function start(container) {
    container.innerHTML = `
        <div class="crawler-info">
            <button class="game-btn crawler-restart">Restart</button>
            <span class="crawler-status"></span>
            <span class="crawler-level"></span>
        </div>
        <canvas class="crawler-canvas" width="1280" height="960"></canvas>
    `;
    const canvas = container.querySelector('.crawler-canvas');
    const ctx = canvas.getContext('2d');
    const statusEl = container.querySelector('.crawler-status');
    const levelEl = container.querySelector('.crawler-level');

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
        levelEl.textContent = 'Level: ' + level;
    }

    function onKeyDown(e) {
        if (gameOver) return;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
        movePlayer(dx, dy);
    }

    // Touch controls: tap to step one cell toward the tapped spot
    function onTouchStart(e) {
        if (gameOver) return;
        const touch = e.touches[0];
        // Get tap position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const tapX = touch.clientX - rect.left;
        const tapY = touch.clientY - rect.top;
        // Convert to grid coordinates
        const gridX = Math.floor(tapX / TILE_SIZE);
        const gridY = Math.floor(tapY / TILE_SIZE);
        // Determine direction to move one step closer
        let dx = 0, dy = 0;
        if (player.x < gridX) dx = 1;
        else if (player.x > gridX) dx = -1;
        if (player.y < gridY) dy = 1;
        else if (player.y > gridY) dy = -1;
        // Prioritize horizontal or vertical if both are possible
        if (dx !== 0 && dy !== 0) {
            // Move in the direction with greater distance
            if (Math.abs(gridX - player.x) > Math.abs(gridY - player.y)) {
                dy = 0;
            } else {
                dx = 0;
            }
        }
        if (dx !== 0 || dy !== 0) {
            movePlayer(dx, dy);
        }
    }

    function movePlayer(dx, dy) {
        let nx = player.x + dx;
        let ny = player.y + dy;
        if (map[ny][nx] === 1) return; // wall
        player.x = nx;
        player.y = ny;
        // Check collision with enemies
        for (let enemy of enemies) {
            if (enemy.x === player.x && enemy.y === player.y) {
                statusEl.textContent = 'Game Over!';
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
            statusEl.textContent = 'Level Up!';
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
                statusEl.textContent = 'Game Over!';
                gameOver = true;
            }
        }
        draw();
    }

    function restartGame() {
        player.x = 1;
        player.y = 1;
        gameOver = false;
        ENEMY_COUNT = 4;
        level = 1;
        generateMap();
        statusEl.textContent = 'Find the exit!';
        draw();
    }

    generateMap();
    document.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    container.querySelector('.crawler-restart').addEventListener('click', restartGame);
    draw();
    statusEl.textContent = 'Find the exit!';
    const enemyTimer = setInterval(moveEnemies, 500);

    return function stop() {
        clearInterval(enemyTimer);
        document.removeEventListener('keydown', onKeyDown);
        container.replaceChildren();
    };
}
