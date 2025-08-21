let joystickActive = false;
let scriptureShown = false;
let facingLeft = false;
let pendingInvulnerability = false;
let scripture2Shown = false;
let scripture3Shown = false;
let currentLevel = 1
let gameState = 'menu';
let player, enemies, scrolls, invulnerable, invulnTimer, gameActive;
let keys = { left: false, right: false };
let gamePaused = false;

const levelBgImg = new Image();
levelBgImg.src = '../../assets/Level1Canvas.png';
const scrollImg = new Image();
scrollImg.src = '../../assets/Scroll.png';
const snakeImg = new Image();
snakeImg.src = '../../assets/Snake.png';
const scorpionImg = new Image();
scorpionImg.src = '../../assets/Scorpion.png';
const tentImg = new Image();
tentImg.src = '../../assets/Tent.png';
const cityImg = new Image();
cityImg.src = '../../assets/City.png';
const nephiImg = new Image();
nephiImg.src = '../../assets/Nephi.png';
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
const endLevel1Scripture = `1Nephi 3:1-7\n\n1 And it came to pass that I, Nephi, returned from speaking with the Lord, to the tent of my father.\n\n2 And it came to pass that he spake unto me, saying: Behold I have dreamed a dream, in the which the Lord hath commanded me that thou and thy brethren shall return to Jerusalem.\n\n3 For behold, Laban hath the record of the Jews and also a genealogy of my forefathers, and they are engraven upon plates of brass.\n\n4 Wherefore, the Lord hath commanded me that thou and thy brothers should go unto the house of Laban, and seek the records, and bring them down hither into the wilderness.\n\n5 And now, behold thy brothers murmur, saying it is a hard thing which I have required of them; but behold I have not required it of them, but it is a commandment of the Lord.\n\n6 Therefore go, my son, and thou shalt be favored of the Lord, because thou hast not murmured.\n\n7 And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.`;


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
    // Add Enter key support for closing popup
    document.addEventListener('keydown', function handleScriptureEnter(e) {
        if (
            scripturePopup &&
            scripturePopup.style.display !== 'none' &&
            (e.key === 'Enter' || e.code === 'Enter')
        ) {
            // Simulate close button click
            closeScriptureBtn.click();
            // Prevent default to avoid accidental form submits
            e.preventDefault();
        }
    });
}
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
// Generate background objects
let backgroundObjects = [];
function generateBackgroundObjects() {
    backgroundObjects = [];
    // Add city at the very beginning of Level 1 (background, large)
    backgroundObjects.push({ type: 'city', x: -60, y: 275, w: 260, h: 100 });
}
// Level 1 scroll messages
let scrollMessages = [
    '1Nephi 2:1-2\n\n1 For behold, it came to pass that the Lord spake unto my father, yea, even in a dream, and said unto him: Blessed art thou, Lehi, because of the things which thou hast done; and because thou hast been faithful and declared unto this people the things which I commanded thee, behold, they seek to take away thy life.\n\n2 And it came to pass that the Lord commanded my father, even in a dream, that he should take his family and depart into the wilderness.',
    '1Nephi 2:3-4\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4  And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.',
    '1Nephi 2: 5-6\n\n5 And he came down by the borders near the shore of the Red Sea; and he traveled in the wilderness in the borders which are nearer the Red Sea; and he did travel in the wilderness with his family, which consisted of my mother, Sariah, and my elder brothers, who were Laman, Lemuel, and Sam.\n\n6 And it came to pass that when he had traveled three days in the wilderness, he pitched his tent in a valley by the side of a river of water.'
];

// Level 2 scroll messages
const scrollMessagesLevel2 = [
    '1Nephi 3:9-11\n\n9 And I, Nephi, and my brethren took our journey in the wilderness, with our tents, to go up to the land of Jerusalem.\n\n10 And it came to pass that when we had gone up to the land of Jerusalem, I and my brethren did consult one with another.\n\n11 And we cast lots—who of us should go in unto the house of Laban. And it came to pass that the lot fell upon Laman; and Laman went in unto the house of Laban, and he talked with him as he sat in his house',
    '1Nephi 3:12-14\n\nFor behold, he knew that Jerusalem must be destroyed, because of the wickedness of the people. For behold, they have rejected the words of the prophets. Wherefore, if my father should dwell in the land after he hath been commanded to flee out of the land, behold, he would perish; wherefore, it must needs be that he flee out of the land.12 And he desired of Laban the records which were engraven upon the plates of brass, which contained the genealogy of my father.\n\n13 And behold, it came to pass that Laban was angry, and thrust him out from his presence; and he would not that he should have the records. Wherefore, he said unto him: Behold thou art a robber, and I will slay thee.\n\n14 But Laman fled out of his presence, and told the things which Laban had done, unto us. And we began to be exceedingly sorrowful, and my brethren were about to return unto my father in the wilderness.',
    '1Nephi 3:22-27\n\nAnd it came to pass that the angel of the Lord spake unto them again, saying: Go up, for the Lord will deliver Laban into your hands22 And it came to pass that we went down to the land of our inheritance, and we did gather together our gold, and our silver, and our precious things.\n\n23 And after we had gathered these things together, we went up again unto the house of Laban.\n\n24 And it came to pass that we went in unto Laban, and desired him that he would give unto us the records which were engraven upon the plates of brass, for which we would give unto him our gold, and our silver, and all our precious things.\n\n25 And it came to pass that when Laban saw our property, and that it was exceedingly great, he did lust after it, insomuch that he thrust us out, and sent his servants to slay us, that he might obtain our property.\n\n26 And it came to pass that we did flee before the servants of Laban, and we were obliged to leave behind our property, and it fell into the hands of Laban.\n\n27 And it came to pass that we fled into the wilderness, and the servants of Laban did not overtake us, and we hid ourselves in the cavity of a rock.'
];

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
// --- Win Popup for Level 2 ---
let winPopup = null;
let winRestartBtn = null;

function createWinPopup() {
    if (winPopup) return; // Only create once
    winPopup = document.createElement('div');
    winPopup.id = 'winPopup';
    winPopup.style.position = 'fixed';
    winPopup.style.left = '0';
    winPopup.style.top = '0';
    winPopup.style.width = '100vw';
    winPopup.style.height = '100vh';
    winPopup.style.background = 'rgba(0,0,0,0.7)';
    winPopup.style.display = 'flex';
    winPopup.style.flexDirection = 'column';
    winPopup.style.justifyContent = 'center';
    winPopup.style.alignItems = 'center';
    winPopup.style.zIndex = '2000';
    winPopup.innerHTML = `
        <div style="background: #fff; padding: 40px 60px; border-radius: 16px; box-shadow: 0 4px 24px #0008; text-align: center;">
            <h2 style="font-size: 2.5em; margin-bottom: 20px; color: #2d7a2d;">You Win!</h2>
            <button id="winRestartBtn" style="font-size: 1.3em; padding: 12px 36px; border-radius: 8px; background: #ffd700; border: 2px solid #bfa100; color: #333; cursor: pointer;">Restart</button>
        </div>
    `;
    document.body.appendChild(winPopup);
    winRestartBtn = document.getElementById('winRestartBtn');
    winRestartBtn.onclick = () => {
        winPopup.style.display = 'none';
        // Reset game to beginning
        // currentLevel = 1;
        // if (gameOverDiv) gameOverDiv.style.display = 'none';
        // if (typeof scripturePopup !== 'undefined' && scripturePopup) scripturePopup.style.display = 'none';
        // showScreen('menu');
        location.reload(); // Reload the page to reset everything
    };
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
    let moveSpeed = 4;
    // If joystick is active (mobile/touch), slow down by half
    if (enableTouchControls && (joystickActive || joystickDir !== 0)) {
        moveSpeed = 2;
    }
    if (keys.left) {
        player.x -= moveSpeed;
        if (player.x < 0) player.x = 0;
        facingLeft = true;
    }
    if (keys.right) {
        player.x += moveSpeed;
        if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;
        facingLeft = false;
    }
    // Invulnerability timer
    if (invulnerable) {
        invulnTimer--;
        if (invulnTimer <= 0) invulnerable = true;
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
    // End level 1: show scripture popup, then transition to level 2
    if (currentLevel === 1 && player.x + player.w >= WORLD_WIDTH - 50) {
        showEndLevel1Popup();
        return;
    }
    // End level 2: reach left side to win
    if (currentLevel === 2 && player.x <= 0) {
        gameActive = false;
        createWinPopup();
        if (winPopup) winPopup.style.display = 'flex';
    }
}
function draw() {
    ctx.clearRect(0, 0, VISIBLE_WIDTH, VISIBLE_HEIGHT);
    // Center camera on player
    let camX = Math.max(0, Math.min(player.x + player.w / 2 - VISIBLE_WIDTH / 2, WORLD_WIDTH - VISIBLE_WIDTH));
    // Draw new background image stretched to cover the whole world
    if (levelBgImg.complete && levelBgImg.naturalWidth !== 0) {
        // Draw the visible portion of the stretched image
        ctx.drawImage(
            levelBgImg,
            camX * (levelBgImg.naturalWidth / WORLD_WIDTH), // sx
            0, // sy
            VISIBLE_WIDTH * (levelBgImg.naturalWidth / WORLD_WIDTH), // sw
            levelBgImg.naturalHeight, // sh
            0, // dx
            0, // dy
            VISIBLE_WIDTH, // dw
            VISIBLE_HEIGHT // dh
        );
    } else {
        // fallback: fill with a solid color
        ctx.fillStyle = '#e2c16b';
        ctx.fillRect(0, 0, VISIBLE_WIDTH, VISIBLE_HEIGHT);
    }
    // Draw city at the beginning (on top of background)
    if (typeof cityImg !== 'undefined' && cityImg.complete && cityImg.naturalWidth !== 0) {
        // City object is always at x: -60, y: 275, w: 260, h: 100
        let cityX = -60;
        let cityY = 260;
        let cityW = 260;
        let cityH = 100;
        if (cityX + cityW > camX && cityX < camX + VISIBLE_WIDTH) {
            ctx.drawImage(cityImg, cityX - camX, cityY, cityW, cityH);
        }
    }

    // Draw tent at end of level (on top of background)
    let tentX = WORLD_WIDTH - 100;
    if (tentX + 80 > camX && tentX < camX + VISIBLE_WIDTH) {
        if (tentImg.complete && tentImg.naturalWidth !== 0) {
            ctx.drawImage(tentImg, tentX - camX, 280, 80, 80);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(tentX - camX, 280, 80, 80);
        }
    }

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
    // (tent drawing moved above)
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
            // Draw white border
            ctx.save();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#fff';
            ctx.globalAlpha = 1.0;
            ctx.strokeRect(player.x - camX - 2.5, player.y - 2.5, player.w + 5, player.h + 5);
            ctx.restore();
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
        if (invulnerable) {
            ctx.save();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#fff';
            ctx.globalAlpha = 1.0;
            ctx.strokeRect(player.x - camX - 2.5, player.y - 2.5, player.w + 5, player.h + 5);
            ctx.restore();
        }
        ctx.fillStyle = invulnerable ? '#00f' : '#964B00';
        ctx.fillRect(player.x - camX, player.y, player.w, player.h);
    }
}

function collide(a, b) {
    return (a.x+10) < b.x + b.w && a.x + (a.w-10) > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function endGame(win) {
    gameActive = false;
    if (win && currentLevel === 1) {
        // Show scripture popup for end of level 1
        showEndLevel1Popup();
        LevelupDiv.style.display = 'block';
        LevelupDiv.querySelector('h2').textContent = 'You Win!';
        gameActive = true;
    } 
    else {
        gameOverDiv.style.display = 'block';
        gameOverDiv.querySelector('h2').textContent = 'Game Over';
    }
}
function showEndLevel1Popup() {
    if (!scripturePopup || !scripturePopup.querySelector('.scripture-text')) return;
    scripturePopup.querySelector('.scripture-text').textContent = endLevel1Scripture;
    scripturePopup.style.display = 'flex';
    gamePaused = true;
    // When closed, start level 2 (move player, keep enemies, reset scrolls, update banner)
    const origClose = closeScriptureBtn.onclick;
    closeScriptureBtn.onclick = () => {
        scripturePopup.style.display = 'none';
        if (gamePaused) {
            gamePaused = false;
            keys.left = false;
            keys.right = false;
            invulnerable = true;
            invulnTimer = 180;
        }
        // Hide the game over banner if visible
        if (gameOverDiv) {
            gameOverDiv.style.display = 'none';
        }
        // Update banner above canvas to 'Level 2'
        const banner = document.getElementById('levelBanner');
        if (banner) {
            banner.textContent = 'Level 2';
        }
        // Transition to level 2: move player to right, keep enemies, reset scrolls
        currentLevel = 2;
        player.x = WORLD_WIDTH - 90;
        player.y = 300;
        player.vy = 0;
        player.onGround = true;
        scrolls = [
            { x: 6000, y: 320, w: 20, h: 30, collected: false },
            { x: 4000, y: 320, w: 20, h: 30, collected: false },
            { x: 2000, y: 320, w: 20, h: 30, collected: false }
        ];
        scrollMessages = scrollMessagesLevel2;
        updateScrollCounter();
        // Remove any popups or banners
        if (typeof scripturePopup !== 'undefined' && scripturePopup) scripturePopup.style.display = 'none';
        // Restore original close handler for future popups
        closeScriptureBtn.onclick = origClose;
    };
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


/////// --- Touch Controls: On-screen joystick and jump button ---
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


// Touch joystick event handlers (restored)
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

