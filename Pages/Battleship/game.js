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

const playerBoardDiv = document.getElementById('player-board');
const enemyBoardDiv = document.getElementById('enemy-board');
const messageDiv = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');

function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
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
            if (isEnemy && !gameOver && turn === 'player' && !(board[r][c] && board[r][c].hit)) {
                cell.addEventListener('click', () => playerAttack(r, c));
            }
            div.appendChild(cell);
        }
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
    playerShips = placeShipsRandomly(playerBoard, SHIPS);
    enemyShips = placeShipsRandomly(enemyBoard, SHIPS);
    playerHits = 0;
    enemyHits = 0;
    turn = 'player';
    gameOver = false;
    messageDiv.textContent = 'Your turn! Click a cell on the enemy board.';
    restartBtn.style.display = 'none';
    renderBoards();
}

restartBtn.onclick = resetGame;
// Start game
resetGame();
