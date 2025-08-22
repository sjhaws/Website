// --- Battleship Game Logic ---
const BOARD_SIZE = 10;
const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
];
let playerBoard = [], enemyBoard = [], playerShips = [], enemyShips = [], playerHits = 0, enemyHits = 0, turn = 'player', gameOver = false;
let placingShips = true;
let currentShipIdx = 0;
let currentShipDir = 'H'; // 'H' or 'V'

const playerBoardDiv = document.getElementById('player-board');
const enemyBoardDiv = document.getElementById('enemy-board');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');

function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function canPlaceShip(board, ship, row, col, dir) {
    for (let i = 0; i < ship.size; i++) {
        const r = row + (dir === 'V' ? i : 0);
        const c = col + (dir === 'H' ? i : 0);
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
        if (board[r][c]) return false;
    }
    return true;
}

function placeShipOnBoard(board, ship, row, col, dir) {
    const coords = [];
    for (let i = 0; i < ship.size; i++) {
        const r = row + (dir === 'V' ? i : 0);
        const c = col + (dir === 'H' ? i : 0);
        board[r][c] = { ship: ship.name, hit: false };
        coords.push([r, c]);
    }
    return { ...ship, coords, hits: 0 };
}

function placeShipsRandomly(board, ships) {
    const placed = [];
    for (const ship of SHIPS) {
        let placedShip = null;
        while (!placedShip) {
            const dir = Math.random() < 0.5 ? 'H' : 'V';
            const row = Math.floor(Math.random() * (dir === 'H' ? BOARD_SIZE : BOARD_SIZE - ship.size + 1));
            const col = Math.floor(Math.random() * (dir === 'V' ? BOARD_SIZE : BOARD_SIZE - ship.size + 1));
            let fits = true;
            for (let i = 0; i < ship.size; i++) {
                const r = row + (dir === 'V' ? i : 0);
                const c = col + (dir === 'H' ? i : 0);
                if (board[r][c]) { fits = false; break; }
            }
            if (fits) {
                const coords = [];
                for (let i = 0; i < ship.size; i++) {
                    const r = row + (dir === 'V' ? i : 0);
                    const c = col + (dir === 'H' ? i : 0);
                    board[r][c] = { ship: ship.name, hit: false };
                    coords.push([r, c]);
                }
                placed.push({ ...ship, coords, hits: 0 });
                placedShip = true;
            }
        }
    }
    return placed;
}

function renderBoard(board, div, showShips, isEnemy) {
    div.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (board[r][c] && board[r][c].ship && showShips) cell.classList.add('ship');
            if (board[r][c] && board[r][c].hit) {
                cell.classList.add(board[r][c].ship ? 'hit' : 'miss');
                cell.textContent = board[r][c].ship ? 'X' : '•';
            }
            // Ship placement phase
            if (placingShips && div === playerBoardDiv && currentShipIdx < SHIPS.length) {
                cell.addEventListener('click', () => handleShipPlacement(r, c));
                // Highlight possible placement
                if (canPlaceShip(playerBoard, SHIPS[currentShipIdx], r, c, currentShipDir)) {
                    cell.style.outline = '2px solid #2d7a2d';
                }
            }
            // Game phase
            if (!placingShips && isEnemy && !gameOver && turn === 'player' && !(board[r][c] && board[r][c].hit)) {
                cell.addEventListener('click', () => playerAttack(r, c));
            }
            div.appendChild(cell);
        }
    }
}

function handleShipPlacement(row, col) {
    if (!canPlaceShip(playerBoard, SHIPS[currentShipIdx], row, col, currentShipDir)) return;
    const ship = placeShipOnBoard(playerBoard, SHIPS[currentShipIdx], row, col, currentShipDir);
    playerShips.push(ship);
    currentShipIdx++;
    if (currentShipIdx >= SHIPS.length) {
        placingShips = false;
        messageDiv.textContent = 'Your turn! Click a cell on the enemy board.';
        // Place enemy ships
        enemyBoard = createEmptyBoard();
        enemyShips = placeShipsRandomly(enemyBoard, SHIPS);
        renderBoards();
    } else {
        messageDiv.textContent = `Place your ${SHIPS[currentShipIdx].name} (${SHIPS[currentShipIdx].size} cells). Click to place. Press R to rotate.`;
        renderBoards();
    }
}
function playerAttack(r, c) {
    if (gameOver || (enemyBoard[r][c] && enemyBoard[r][c].hit)) return;
    enemyBoard[r][c] = enemyBoard[r][c] || { hit: false };
    enemyBoard[r][c].hit = true;
    if (enemyBoard[r][c].ship) {
        messageDiv.textContent = 'Hit!';
        enemyHits++;
        for (const ship of enemyShips) {
            for (const [sr, sc] of ship.coords) {
                if (sr === r && sc === c) {
                    ship.hits++;
                    if (ship.hits === ship.size) {
                        messageDiv.textContent = `You sank the enemy's ${ship.name}!`;
                    }
                }
            }
        }
        if (enemyHits === 17) return endGame('player');
    } else {
        messageDiv.textContent = 'Miss!';
    }
    turn = 'enemy';
    renderBoards();
    setTimeout(enemyAttack, 800);
}

function enemyAttack() {
    if (gameOver) return;
    let r, c;
    do {
        r = Math.floor(Math.random() * BOARD_SIZE);
        c = Math.floor(Math.random() * BOARD_SIZE);
    } while (playerBoard[r][c] && playerBoard[r][c].hit);
    playerBoard[r][c] = playerBoard[r][c] || { hit: false };
    playerBoard[r][c].hit = true;
    if (playerBoard[r][c].ship) {
        messageDiv.textContent = 'Enemy hit your ship!';
        playerHits++;
        for (const ship of playerShips) {
            for (const [sr, sc] of ship.coords) {
                if (sr === r && sc === c) {
                    ship.hits++;
                    if (ship.hits === ship.size) {
                        messageDiv.textContent = `Enemy sank your ${ship.name}!`;
                    }
                }
            }
        }
        if (playerHits === 17) return endGame('enemy');
    } else {
        messageDiv.textContent = 'Enemy missed!';
    }
    turn = 'player';
    renderBoards();
}

function endGame(winner) {
    gameOver = true;
    if (winner === 'player') {
        messageDiv.textContent = 'You win! All enemy ships sunk!';
    } else {
        messageDiv.textContent = 'You lose! All your ships sunk!';
    }
    restartBtn.style.display = 'block';
}

function renderBoards() {
    renderBoard(playerBoard, playerBoardDiv, true, false);
    renderBoard(enemyBoard, enemyBoardDiv, false, true);
}

function resetGame() {
    playerBoard = createEmptyBoard();
    enemyBoard = createEmptyBoard();
    playerShips = [];
    enemyShips = [];
    playerHits = 0;
    enemyHits = 0;
    turn = 'player';
    gameOver = false;
    placingShips = true;
    currentShipIdx = 0;
    currentShipDir = 'H';
    messageDiv.textContent = `Place your ${SHIPS[0].name} (${SHIPS[0].size} cells). Click to place. Press R to rotate.`;
    restartBtn.style.display = 'none';
    renderBoards();
}

// Allow player to rotate ship with R key
window.addEventListener('keydown', e => {
    if (placingShips && (e.key === 'r' || e.key === 'R')) {
        currentShipDir = currentShipDir === 'H' ? 'V' : 'H';
        renderBoards();
    }
});
restartBtn.onclick = resetGame;
// Start game
resetGame();
