// Scripture popup logic
const scripturePopup = document.getElementById('scripturePopup');
const closeScriptureBtn = document.getElementById('closeScriptureBtn');
if (closeScriptureBtn) {
    closeScriptureBtn.onclick = () => {
        scripturePopup.style.display = 'none';
        if (gamePaused) {
            gamePaused = false;
            keys.left = false;
            keys.right = false;
            invulnerable = true;
            invulnTimer = 180; // 3 seconds at 60fps
        }
    };
}
let scriptureShown = false;
let facingLeft = false;
let pendingInvulnerability = false;
let scripture2Shown = false;
let scripture3Shown = false;
// Update scroll counter UI
function updateScrollCounter() {
    const scrollCount = scrolls ? scrolls.filter(s => s.collected).length : 0;
    const scrollCountSpan = document.getElementById('scrollCount');
    if (scrollCountSpan) scrollCountSpan.textContent = scrollCount;
    // Show popup if a scroll was just collected
    if (typeof updateScrollCounter.lastCount === 'undefined') {
        updateScrollCounter.lastCount = 0;
    }
    if (scrollCount > updateScrollCounter.lastCount && scrollCount <= scrollMessages.length) {
        showScrollPopup(scrollCount - 1);
    }
    updateScrollCounter.lastCount = scrollCount;
}
// Load background images
const cactusImg = new Image();
cactusImg.src = '../../assets/Cactus.png';
const sand1Img = new Image();
sand1Img.src = '../../assets/Sand1.png';
const sand2Img = new Image();
sand2Img.src = '../../assets/Sand2.png';
const sand3Img = new Image();
sand3Img.src = '../../assets/Sand3.png';

// Generate background objects
let backgroundObjects = [];
function generateBackgroundObjects() {
    backgroundObjects = [];
    // Place cacti every ~800px
    // All background objects should be on the same plane as the character (y = 300)
    for (let x = 200; x < WORLD_WIDTH; x += 800) {
        // 50% smaller: w: 30, h: 60, y aligned so base is at y=360
        backgroundObjects.push({ type: 'cactus', x: x, y: 360 - 60, w: 30, h: 60 });
    }
    // Place sand patches randomly
    for (let i = 0; i < 20; i++) {
        let sandType = ['sand1', 'sand2', 'sand3'][Math.floor(Math.random() * 3)];
        let sandX = Math.floor(Math.random() * (WORLD_WIDTH - 100));
        // Align sand to y = 360 - 80 (ground - sand height)
        let sandY = 360 - 80;
        backgroundObjects.push({ type: sandType, x: sandX, y: sandY, w: 100, h: 80 });
    }
}
// Load scroll image
const scrollImg = new Image();
scrollImg.src = '../../assets/Scroll.png';
// Load images for enemies and tent
const snakeImg = new Image();
snakeImg.src = '../../assets/Snake.png';
const scorpionImg = new Image();
scorpionImg.src = '../../assets/Scorpion.png';
const tentImg = new Image();
tentImg.src = '../../assets/Tent.png';
// Load Nephi image
const nephiImg = new Image();
nephiImg.src = '../../assets/Nephi.png';

// I, Nephi - Level 1 Game Logic
const menu = document.getElementById('menu');
const exposition = document.getElementById('exposition');
const gameContainer = document.getElementById('gameContainer');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');

const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const gameOverDiv = document.getElementById('gameOver');

const VISIBLE_WIDTH = 800;
const VISIBLE_HEIGHT = 400;
const WORLD_WIDTH = VISIBLE_WIDTH * 10;
const WORLD_HEIGHT = VISIBLE_HEIGHT;

let gameState = 'menu';
let player, enemies, scrolls, invulnerable, invulnTimer, gameActive;
let keys = { left: false, right: false };

// Popup messages for each scroll
const scrollMessages = [
    '1Nephi 2:1-2\n\n1 For behold, it came to pass that the Lord spake unto my father, yea, even in a dream, and said unto him: Blessed art thou, Lehi, because of the things which thou hast done; and because thou hast been faithful and declared unto this people the things which I commanded thee, behold, they seek to take away thy life.\n\n2 And it came to pass that the Lord commanded my father, even in a dream, that he should take his family and depart into the wilderness.',
    '1Nephi 2:3-4\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4  And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.',
    '1Nephi 2: 5-6\n\n5 And he came down by the borders near the shore of the Red Sea; and he traveled in the wilderness in the borders which are nearer the Red Sea; and he did travel in the wilderness with his family, which consisted of my mother, Sariah, and my elder brothers, who were Laman, Lemuel, and Sam.\n\n6 And it came to pass that when he had traveled three days in the wilderness, he pitched his tent in a valley by the side of a river of water.'
];
let gamePaused = false;

function showScreen(screen) {
    menu.style.display = screen === 'menu' ? 'block' : 'none';
    exposition.style.display = screen === 'exposition' ? 'block' : 'none';
    gameContainer.style.display = screen === 'game' ? 'block' : 'none';
}

startBtn.onclick = () => {
    showScreen('exposition');
    gameState = 'exposition';
};

nextBtn.onclick = () => {
    showScreen('game');
    gameState = 'game';
    startGame();
};

restartBtn.onclick = () => {
    gameOverDiv.style.display = 'none';
    startGame();
};

function startGame() {
    player = { x: 50, y: 300, w: 40, h: 60, vy: 0, onGround: true };
    // Spread enemies and scrolls through the world
    enemies = [
        { x: 300, y: 340, w: 40, h: 20, type: 'snake', dir: 1 },
        { x: 1200, y: 340, w: 40, h: 20, type: 'scorpion', dir: 1 },
        { x: 2000, y: 340, w: 40, h: 20, type: 'snake', dir: 1 },
        { x: 3500, y: 340, w: 40, h: 20, type: 'scorpion', dir: 1 },
        { x: 5000, y: 340, w: 40, h: 20, type: 'snake', dir: 1 },
        { x: 6500, y: 340, w: 40, h: 20, type: 'scorpion', dir: 1 },
        { x: 8000, y: 340, w: 40, h: 20, type: 'snake', dir: 1 }
    ];
    // Set up random movement interval
    if (window.enemyMoveInterval) clearInterval(window.enemyMoveInterval);
    window.enemyMoveInterval = setInterval(() => {
        enemies.forEach(enemy => {
            // Randomly choose direction: -1 (left) or 1 (right)
            enemy.dir = Math.random() < 0.5 ? -1 : 1;
        });
    }, 500);
    scrolls = [
        { x: 1000, y: 320, w: 20, h: 30, collected: false },
        { x: 4000, y: 320, w: 20, h: 30, collected: false },
        { x: 7000, y: 320, w: 20, h: 30, collected: false }
    ];
    updateScrollCounter();
    invulnerable = false;
    invulnTimer = 0;
    gameActive = true;
    keys = { left: false, right: false };
    generateBackgroundObjects();
    gameOverDiv.style.display = 'none';
    window.requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    window.requestAnimationFrame(gameLoop);
}

function update() {
    if (gamePaused) return;
    // Gravity
    if (!player.onGround) {
        player.vy += 1.5;
        player.y += player.vy;
        if (player.y >= 300) {
            player.y = 300;
            player.vy = 0;
            player.onGround = true;
        }
    }
    // Horizontal movement
    if (keys.left) {
        player.x -= 4;
        if (player.x < 0) player.x = 0;
        facingLeft = true;
    }
    if (keys.right) {
        player.x += 4;
        if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;
        facingLeft = false;
    }
    // Invulnerability timer
    if (invulnerable) {
        invulnTimer--;
        if (invulnTimer <= 0) invulnerable = false;
    }
    // Collision with scrolls
    let collectedBefore = scrolls.filter(s => s.collected).length;
    let popupToShow = -1;
    scrolls.forEach((scroll, idx) => {
        if (!scroll.collected && collide(player, scroll)) {
            scroll.collected = true;
            if (popupToShow === -1) popupToShow = idx;
        }
    });
    let collectedAfter = scrolls.filter(s => s.collected).length;
    if (collectedAfter !== collectedBefore) {
        updateScrollCounter();
        if (popupToShow !== -1) {
            showScrollPopup(popupToShow);
        }
    }
    // Move enemies
    enemies.forEach(enemy => {
        // Move back and forth, keep within a 100px range from their original x
        let minX = enemy.x - 50;
        let maxX = enemy.x + 50;
        if (!enemy.baseX) enemy.baseX = enemy.x;
        minX = enemy.baseX - 50;
        maxX = enemy.baseX + 50;
        enemy.x += enemy.dir * 2;
        if (enemy.x < minX) enemy.x = minX;
        if (enemy.x > maxX) enemy.x = maxX;
        // Collision with player
        if (collide(player, enemy) && !invulnerable) {
            endGame();
        }
    });
    // End level
    if (player.x + player.w >= WORLD_WIDTH - 50) {
        endGame(true);
    }
}

function draw() {
    ctx.clearRect(0, 0, VISIBLE_WIDTH, VISIBLE_HEIGHT);
    // Center camera on player
    let camX = Math.max(0, Math.min(player.x + player.w / 2 - VISIBLE_WIDTH / 2, WORLD_WIDTH - VISIBLE_WIDTH));
    // Desert background
    ctx.fillStyle = '#e2c16b';
    ctx.fillRect(0, 0, VISIBLE_WIDTH, VISIBLE_HEIGHT);
    // Draw sand patches and cacti
    backgroundObjects.forEach(obj => {
        if (obj.x + obj.w > camX && obj.x < camX + VISIBLE_WIDTH) {
            let img = null;
            if (obj.type === 'cactus' && cactusImg.complete && cactusImg.naturalWidth !== 0) img = cactusImg;
            if (obj.type === 'sand1' && sand1Img.complete && sand1Img.naturalWidth !== 0) img = sand1Img;
            if (obj.type === 'sand2' && sand2Img.complete && sand2Img.naturalWidth !== 0) img = sand2Img;
            if (obj.type === 'sand3' && sand3Img.complete && sand3Img.naturalWidth !== 0) img = sand3Img;
            if (img) {
                ctx.drawImage(img, obj.x - camX, obj.y, obj.w, obj.h);
            } else {
                // fallback shapes
                if (obj.type === 'cactus') {
                    ctx.fillStyle = '#228B22';
                    ctx.fillRect(obj.x - camX, obj.y, obj.w, obj.h);
                } else {
                    ctx.fillStyle = '#e2c16b';
                    ctx.fillRect(obj.x - camX, obj.y, obj.w, obj.h);
                }
            }
        }
    });
    // Draw ground
    ctx.fillStyle = '#c2b280';
    ctx.fillRect(0, 360, VISIBLE_WIDTH, 40);
    // Draw enemies
    enemies.forEach(enemy => {
        if (enemy.x + enemy.w > camX && enemy.x < camX + VISIBLE_WIDTH) {
            let img = null;
            if (enemy.type === 'snake' && snakeImg.complete && snakeImg.naturalWidth !== 0) img = snakeImg;
            if (enemy.type === 'scorpion' && scorpionImg.complete && scorpionImg.naturalWidth !== 0) img = scorpionImg;
            if (img) {
                ctx.save();
                if (enemy.dir === -1) {
                    ctx.translate(enemy.x - camX + enemy.w, enemy.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, enemy.w, enemy.h);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                } else {
                    ctx.drawImage(img, enemy.x - camX, enemy.y, enemy.w, enemy.h);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = enemy.type === 'snake' ? '#228B22' : '#A0522D';
                ctx.fillRect(enemy.x - camX, enemy.y, enemy.w, enemy.h);
            }
        }
    });
    // Draw tent at end of level
    let tentX = WORLD_WIDTH - 100;
    if (tentX + 80 > camX && tentX < camX + VISIBLE_WIDTH) {
        if (tentImg.complete && tentImg.naturalWidth !== 0) {
            ctx.drawImage(tentImg, tentX - camX, 280, 80, 80);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(tentX - camX, 280, 80, 80);
        }
    }
    // Draw scrolls
    scrolls.forEach(scroll => {
        if (!scroll.collected && scroll.x + scroll.w > camX && scroll.x < camX + VISIBLE_WIDTH) {
            if (scrollImg.complete && scrollImg.naturalWidth !== 0) {
                ctx.drawImage(scrollImg, scroll.x - camX, scroll.y, scroll.w, scroll.h);
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(scroll.x - camX, scroll.y, scroll.w, scroll.h);
            }
        }
    });
    // Draw player (Nephi image)
    if (nephiImg.complete && nephiImg.naturalWidth !== 0) {
        ctx.save();
        if (invulnerable) {
            ctx.globalAlpha = 0.6;
        }
        if (facingLeft) {
            ctx.translate(player.x - camX + player.w, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(nephiImg, 0, 0, player.w, player.h);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        } else {
            ctx.drawImage(nephiImg, player.x - camX, player.y, player.w, player.h);
        }
        ctx.restore();
    } else {
        // fallback rectangle if image not loaded
        ctx.fillStyle = invulnerable ? '#00f' : '#964B00';
        ctx.fillRect(player.x - camX, player.y, player.w, player.h);
    }
}

function collide(a, b) {
    return (a.x+10) < b.x + b.w && a.x + (a.w-10) > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function endGame(win = false) {
    gameActive = false;
    gameOverDiv.style.display = 'block';
    gameOverDiv.querySelector('h2').textContent = win ? 'You Win!' : 'Game Over';
}

function showScrollPopup(idx) {
    if (!scripturePopup || !scripturePopup.querySelector('.scripture-text')) return;
    scripturePopup.querySelector('.scripture-text').textContent = scrollMessages[idx];
    scripturePopup.style.display = 'flex';
    gamePaused = true;
}

// Controls: left/right arrows for movement, up arrow for jump
window.addEventListener('keydown', e => {
    if (gameState === 'game' && !gamePaused) {
        if (e.code === 'ArrowLeft') keys.left = true;
        if (e.code === 'ArrowRight') keys.right = true;
        if (e.code === 'ArrowUp' && player.onGround) {
            player.vy = -22.5; // 25% farther jump (-18 * 1.25)
            player.onGround = false;
        }
    }
});
window.addEventListener('keyup', e => {
    if (gameState === 'game' && !gamePaused) {
        if (e.code === 'ArrowLeft') keys.left = false;
        if (e.code === 'ArrowRight') keys.right = false;
    }
});

// Touch controls
function createTouchControls() {
    const controls = document.createElement('div');
    controls.id = 'touchControls';
    controls.style.position = 'fixed';
    controls.style.left = '0';
    controls.style.right = '0';
    controls.style.bottom = '20px';
    controls.style.zIndex = '200';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'center';
    controls.style.gap = '32px';
    controls.style.pointerEvents = 'none';

    function makeBtn(label, onDown, onUp) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.fontSize = '2em';
        btn.style.width = '64px';
        btn.style.height = '64px';
        btn.style.borderRadius = '50%';
        btn.style.background = '#fff7d6';
        btn.style.border = '2px solid #c2b280';
        btn.style.boxShadow = '0 2px 8px #0002';
        btn.style.opacity = '0.85';
        btn.style.pointerEvents = 'auto';
        btn.style.touchAction = 'none';
        btn.addEventListener('touchstart', e => { e.preventDefault(); onDown(); });
        btn.addEventListener('touchend', e => { e.preventDefault(); onUp(); });
        btn.addEventListener('touchcancel', e => { e.preventDefault(); onUp(); });
        return btn;
    }

    const leftBtn = makeBtn('◀', () => { keys.left = true; }, () => { keys.left = false; });
    const jumpBtn = makeBtn('▲', () => {
        if (player && player.onGround && !gamePaused) {
            player.vy = -22.5;
            player.onGround = false;
        }
    }, () => {});
    const rightBtn = makeBtn('▶', () => { keys.right = true; }, () => { keys.right = false; });

    controls.appendChild(leftBtn);
    controls.appendChild(jumpBtn);
    controls.appendChild(rightBtn);
    document.body.appendChild(controls);
}

// Only add touch controls if on a touch device
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    window.addEventListener('DOMContentLoaded', createTouchControls);
}
