// Carmen Racing - 8 Bit Classic
// Simple 2D top-down endless racer
//
// start(container) builds the game inside `container` and returns stop(),
// which removes everything the game added: elements, listeners and the
// animation loop.

// Game constants
const W = 320;
const H = 480;
const ROAD_W = 120;
const ROAD_X = (W - ROAD_W) / 2;
const LANE_W = ROAD_W / 3;
const CAR_W = 24, CAR_H = 32;
const OBSTACLE_W = 24, OBSTACLE_H = 32;
const FLAG_W = 16, FLAG_H = 16;

// Sprites, resolved relative to this file rather than the page
const carImg = new Image();
carImg.src = new URL('../../assets/Carmen.webp', import.meta.url).href;
const obstacleImg = new Image();
obstacleImg.src = new URL('../../assets/car.webp', import.meta.url).href;
const treeImg = new Image();
treeImg.src = new URL('../../assets/tree.webp', import.meta.url).href;

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < 600 || window.innerHeight < 600);
}

export function start(container) {
    container.innerHTML = `
        <div class="carmen-racing">
            <button class="carmen-arrow carmen-arrow-left" aria-label="Left">&#8592;</button>
            <canvas width="${W}" height="${H}"></canvas>
            <button class="carmen-start">Start</button>
            <button class="carmen-arrow carmen-arrow-right" aria-label="Right">&#8594;</button>
            <div class="carmen-instructions">
                Use <b>←</b> and <b>→</b> to steer. Avoid obstacles and collect flags!<br>
                Press <b>Space</b> to start or restart.<br>
                <span style="font-size:0.9em;">On mobile, use the arrow buttons.</span>
            </div>
            <button class="carmen-restart">Restart</button>
        </div>
    `;
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const leftBtn = container.querySelector('.carmen-arrow-left');
    const rightBtn = container.querySelector('.carmen-arrow-right');
    const startBtn = container.querySelector('.carmen-start');
    const restartBtn = container.querySelector('.carmen-restart');

    function drawCar(x, y) {
        if (carImg.complete) {
            ctx.drawImage(carImg, x, y, CAR_W, CAR_H);
        } else {
            carImg.onload = () => ctx.drawImage(carImg, x, y, CAR_W, CAR_H);
        }
    }
    function drawObstacle(x, y) {
        if (obstacleImg.complete) {
            ctx.drawImage(obstacleImg, x, y, OBSTACLE_W, OBSTACLE_H);
        } else {
            obstacleImg.onload = () => ctx.drawImage(obstacleImg, x, y, OBSTACLE_W, OBSTACLE_H);
        }
    }
    function drawFlag(x, y) {
        ctx.fillStyle = '#00fff7';
        ctx.fillRect(x, y, FLAG_W, FLAG_H);
        ctx.fillStyle = '#fff600';
        ctx.fillRect(x + 4, y + 4, 8, 8);
    }
    function drawTree(x, y) {
        if (treeImg.complete) {
            ctx.drawImage(treeImg, x, y, 24, 32);
        } else {
            treeImg.onload = () => ctx.drawImage(treeImg, x, y, 24, 32);
        }
    }

    // Game state
    let player = { lane: 1, y: H - CAR_H - 12, speed: isMobileDevice() ? 2 : 4, alive: true, score: 0 };
    let obstacles = [];
    let flags = [];
    let trees = [];
    let frame = 0;
    let gameOver = false;
    let started = false;
    let frameId = null;

    function resetGame() {
        player.lane = 1;
        player.y = H - CAR_H - 12;
        player.speed = isMobileDevice() ? 2 : 4;
        player.alive = true;
        player.score = 0;
        obstacles = [];
        flags = [];
        trees = [];
        // Randomly spread trees on both sides
        for (let i = 0; i < 10; i++) {
            // Left grass area
            trees.push({
                x: Math.random() * (ROAD_X - 24),
                y: Math.random() * H
            });
            // Right grass area
            trees.push({
                x: ROAD_X + ROAD_W + 8 + Math.random() * (W - (ROAD_X + ROAD_W + 32)),
                y: Math.random() * H
            });
        }
        frame = 0;
        gameOver = false;
        started = false;
        restartBtn.style.display = 'none';
        startBtn.style.display = 'none';
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
        // Move trees (twice as fast as obstacles)
        for (const tree of trees) tree.y += player.speed * 2;
        // Remove off-screen and respawn trees at top with new random x
        for (const tree of trees) {
            if (tree.y > H) {
                tree.y = -32;
                // Decide if left or right side
                if (tree.x < ROAD_X) {
                    tree.x = Math.random() * (ROAD_X - 24);
                } else {
                    tree.x = ROAD_X + ROAD_W + 8 + Math.random() * (W - (ROAD_X + ROAD_W + 32));
                }
            }
        }
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
                restartBtn.style.display = 'block';
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
        const maxSpeed = isMobileDevice() ? 6 : 12;
        const speedStep = isMobileDevice() ? 0.25 : 0.5;
        if (frame % 180 === 0 && player.speed < maxSpeed) player.speed += speedStep;
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // Draw grass (background)
        ctx.fillStyle = '#1fa31f';
        ctx.fillRect(0, 0, W, H);
        // Draw road (all lanes dark grey)
        ctx.fillStyle = '#222';
        ctx.fillRect(ROAD_X, 0, ROAD_W, H);
        // Draw trees (behind road)
        for (const tree of trees) {
            drawTree(tree.x, tree.y);
        }
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
        frameId = requestAnimationFrame(gameLoop);
    }

    // Show the on-screen arrows (and the Start button until the game starts)
    // on small screens only.
    function updateMobileUI() {
        const isMobile = window.innerWidth < 600 || window.innerHeight < 600;
        if (isMobile) {
            leftBtn.style.display = 'block';
            rightBtn.style.display = 'block';
            startBtn.style.display = started ? 'none' : 'block';
        } else {
            leftBtn.style.display = 'none';
            rightBtn.style.display = 'none';
            startBtn.style.display = 'none';
        }
    }

    function onKeyDown(e) {
        if (!player.alive && (e.key === ' ' || e.key === 'Spacebar')) {
            resetGame();
            started = true;
            startBtn.style.display = 'none';
            return;
        }
        if (!started && (e.key === ' ' || e.key === 'Spacebar')) {
            started = true;
            startBtn.style.display = 'none';
            return;
        }
        if (!player.alive) return;
        if (e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
        if (e.key === 'ArrowRight' && player.lane < 2) player.lane++;
    }

    // Mobile arrow button support (move only one lane per tap)
    function steer(direction) {
        if (!player.alive) return;
        if (direction === 'left' && player.lane > 0) {
            player.lane--;
        } else if (direction === 'right' && player.lane < 2) {
            player.lane++;
        }
    }

    leftBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        steer('left');
    });
    rightBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        steer('right');
    });
    startBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!started) {
            started = true;
            startBtn.style.display = 'none';
        }
    });
    restartBtn.addEventListener('click', () => {
        resetGame();
        started = true;
    });
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updateMobileUI);
    window.addEventListener('orientationchange', updateMobileUI);

    resetGame();
    updateMobileUI();
    gameLoop();

    return function stop() {
        cancelAnimationFrame(frameId);
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', updateMobileUI);
        window.removeEventListener('orientationchange', updateMobileUI);
        container.replaceChildren();
    };
}
