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
// Load city image
const cityImg = new Image();
cityImg.src = '../../assets/City.png';

// Generate background objects
let backgroundObjects = [];
function generateBackgroundObjects() {
    backgroundObjects = [];
    // Add city at the very beginning (background, large)
    backgroundObjects.push({ type: 'city', x: -60, y: 275, w: 260, h: 100 });
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
            if (obj.type === 'city' && cityImg.complete && cityImg.naturalWidth !== 0) img = cityImg;
            if (obj.type === 'cactus' && cactusImg.complete && cactusImg.naturalWidth !== 0) img = cactusImg;
            if (obj.type === 'sand1' && sand1Img.complete && sand1Img.naturalWidth !== 0) img = sand1Img;
            if (obj.type === 'sand2' && sand2Img.complete && sand2Img.naturalWidth !== 0) img = sand2Img;
            if (obj.type === 'sand3' && sand3Img.complete && sand3Img.naturalWidth !== 0) img = sand3Img;
            if (img) {
                ctx.drawImage(img, obj.x - camX, obj.y, obj.w, obj.h);
            } else {
                // fallback shapes
                if (obj.type === 'city') {
                    ctx.fillStyle = '#888';
                    ctx.fillRect(obj.x - camX, obj.y, obj.w, obj.h);
                } else if (obj.type === 'cactus') {
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

// --- Touch Controls: On-screen joystick and jump button ---
// Create joystick and jump button elements
const joystickContainer = document.createElement('div');
joystickContainer.id = 'joystick-container';
joystickContainer.style.position = 'absolute';
joystickContainer.style.left = '30px';
joystickContainer.style.bottom = '30px';
joystickContainer.style.width = '120px';
joystickContainer.style.height = '120px';
joystickContainer.style.zIndex = '1000';
joystickContainer.style.touchAction = 'none';
joystickContainer.style.userSelect = 'none';
joystickContainer.style.display = 'none';

const joystickBase = document.createElement('div');
joystickBase.style.width = '100%';
joystickBase.style.height = '100%';
joystickBase.style.background = 'rgba(100,100,100,0.2)';
joystickBase.style.borderRadius = '50%';
joystickBase.style.position = 'absolute';
joystickBase.style.left = '0';
joystickBase.style.top = '0';
joystickContainer.appendChild(joystickBase);

const joystickStick = document.createElement('div');
joystickStick.style.width = '60px';
joystickStick.style.height = '60px';
joystickStick.style.background = 'rgba(80,80,80,0.7)';
joystickStick.style.borderRadius = '50%';
joystickStick.style.position = 'absolute';
joystickStick.style.left = '30px';
joystickStick.style.top = '30px';
joystickStick.style.transition = 'left 0.05s, top 0.05s';
joystickContainer.appendChild(joystickStick);

const jumpBtn = document.createElement('button');
jumpBtn.id = 'jump-btn';
jumpBtn.textContent = 'Jump';
jumpBtn.style.position = 'absolute';
jumpBtn.style.right = '40px';
jumpBtn.style.bottom = '50px';
jumpBtn.style.width = '90px';
jumpBtn.style.height = '90px';
jumpBtn.style.borderRadius = '50%';
jumpBtn.style.background = 'rgba(255, 215, 0, 0.85)';
jumpBtn.style.fontSize = '1.5em';
jumpBtn.style.zIndex = '1000';
jumpBtn.style.border = '2px solid #bfa100';
jumpBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
jumpBtn.style.display = 'none';

// Add to game container
if (gameContainer) {
    gameContainer.appendChild(joystickContainer);
    gameContainer.appendChild(jumpBtn);
}

// Detect if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

let enableTouchControls = isMobileDevice();

// Show/hide controls when game starts/ends
function setTouchControlsVisible(visible) {
    if (enableTouchControls) {
        joystickContainer.style.display = visible ? 'block' : 'none';
        jumpBtn.style.display = visible ? 'block' : 'none';
    } else {
        joystickContainer.style.display = 'none';
        jumpBtn.style.display = 'none';
    }
}

// Show controls when game starts
const origStartGame = startGame;
startGame = function() {
    setTouchControlsVisible(true);
    origStartGame();
};
// Hide controls on game over
const origEndGame = endGame;
endGame = function(win = false) {
    setTouchControlsVisible(false);
    origEndGame(win);
};

// Joystick logic
let joystickActive = false;
let joystickStart = { x: 0, y: 0 };
let joystickPos = { x: 10, y: 10 };
let joystickDir = 0; // -1: left, 1: right, 0: neutral

function setJoystickKeys(dir) {
    if (dir === -1) {
        keys.left = true;
        keys.right = false;
    } else if (dir === 1) {
        keys.left = false;
        keys.right = true;
    } else {
        keys.left = false;
        keys.right = false;
    }
}

function handleJoystickMove(clientX, clientY) {
    const rect = joystickContainer.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    // Clamp to circle radius 50px from center (60,60)
    let dx = x - 60;
    let dy = y - 60;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 50) {
        dx = dx * 50 / dist;
        dy = dy * 50 / dist;
        x = 60 + dx;
        y = 60 + dy;
    }
    joystickStick.style.left = (x - 30) + 'px';
    joystickStick.style.top = (y - 30) + 'px';
    // Direction: left/right only
    if (dx < -15) {
        setJoystickKeys(-1);
        joystickDir = -1;
    } else if (dx > 15) {
        setJoystickKeys(1);
        joystickDir = 1;
    } else {
        setJoystickKeys(0);
        joystickDir = 0;
    }
}

joystickContainer.addEventListener('touchstart', function(e) {
    if (e.touches.length > 0) {
        joystickActive = true;
        handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }
}, { passive: false });
joystickContainer.addEventListener('touchmove', function(e) {
    if (joystickActive && e.touches.length > 0) {
        handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }
}, { passive: false });
joystickContainer.addEventListener('touchend', function(e) {
    joystickActive = false;
    joystickStick.style.left = '30px';
    joystickStick.style.top = '30px';
    setJoystickKeys(0);
    joystickDir = 0;
    e.preventDefault();
}, { passive: false });

// Also support mouse for testing
joystickContainer.addEventListener('mousedown', function(e) {
    joystickActive = true;
    handleJoystickMove(e.clientX, e.clientY);
    e.preventDefault();
});
window.addEventListener('mousemove', function(e) {
    if (joystickActive) {
        handleJoystickMove(e.clientX, e.clientY);
        e.preventDefault();
    }
});
window.addEventListener('mouseup', function(e) {
    if (joystickActive) {
        joystickActive = false;
        joystickStick.style.left = '30px';
        joystickStick.style.top = '30px';
        setJoystickKeys(0);
        joystickDir = 0;
        e.preventDefault();
    }
});

// Jump button logic
jumpBtn.addEventListener('touchstart', function(e) {
    if (gameState === 'game' && !gamePaused && player.onGround) {
        player.vy = -22.5;
        player.onGround = false;
    }
    e.preventDefault();
}, { passive: false });
jumpBtn.addEventListener('mousedown', function(e) {
    if (gameState === 'game' && !gamePaused && player.onGround) {
        player.vy = -22.5;
        player.onGround = false;
    }
    e.preventDefault();
});
