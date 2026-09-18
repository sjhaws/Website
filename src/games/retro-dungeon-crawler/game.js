// Retro Dungeon Crawler: find the exit of a random dungeon while avoiding
// enemies. Each level adds more enemies.
//
// start(container) builds the game inside `container` and returns stop(),
// which removes everything the game added: elements, listeners and timers.

import buttonStyles from '../../components/RetroButton.module.css'
import styles from './game.module.css'

const TILE_SIZE = 32
const MAP_WIDTH = 40
const MAP_HEIGHT = 30
const FLOOR = 0
const WALL = 1
const EXIT = 2
const START = { x: 1, y: 1 }
const EXIT_POSITION = { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 }
const STARTING_ENEMIES = 4
const ENEMY_STEP_MS = 500
// Enemies never take more than this share of the open floor, so placing them
// always finishes. Uncapped, level 15 would need more enemies than tiles.
const MAX_ENEMY_SHARE = 0.2
// No enemy starts within this many steps of the player, so a level can't be
// lost before the first move now that enemies can catch you.
const SAFE_DISTANCE = 4

// The index is also the enemy's facing: its triangle is rotated dir × 90°.
const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
]
const UP = 0
const RIGHT = 1
const DOWN = 2
const LEFT = 3

const KEY_DIRECTIONS = {
  arrowup: UP,
  w: UP,
  arrowright: RIGHT,
  d: RIGHT,
  arrowdown: DOWN,
  s: DOWN,
  arrowleft: LEFT,
  a: LEFT,
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function randomMap() {
  const map = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const edge =
        x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1
      row.push(edge || Math.random() < 0.12 ? WALL : FLOOR)
    }
    map.push(row)
  }
  map[START.y][START.x] = FLOOR
  map[EXIT_POSITION.y][EXIT_POSITION.x] = EXIT
  return map
}

// Number of steps from `from` to every tile, walking around walls
// (Infinity where there's no path).
function stepsFrom(map, from) {
  const steps = map.map((row) => row.map(() => Infinity))
  steps[from.y][from.x] = 0
  const queue = [from]
  for (let i = 0; i < queue.length; i++) {
    const { x, y } = queue[i]
    for (const { dx, dy } of DIRECTIONS) {
      const nx = x + dx
      const ny = y + dy
      if (map[ny][nx] !== WALL && steps[ny][nx] === Infinity) {
        steps[ny][nx] = steps[y][x] + 1
        queue.push({ x: nx, y: ny })
      }
    }
  }
  return steps
}

export function start(container) {
  container.innerHTML = `
    <div class="${styles.info}">
      <button type="button" class="${buttonStyles.button} ${buttonStyles.small}" data-action="restart">Restart</button>
      <div class="${styles.difficulty}" role="group" aria-label="Difficulty">
        <button type="button" class="${buttonStyles.button} ${buttonStyles.small}" data-difficulty="easy" aria-pressed="true">Easy</button>
        <button type="button" class="${buttonStyles.button} ${buttonStyles.small}" data-difficulty="hard" aria-pressed="false">Hard</button>
      </div>
      <span class="${styles.status}" data-role="status" aria-live="polite"></span>
      <span class="${styles.status}" data-role="level"></span>
    </div>
    <canvas class="${styles.canvas}" width="${MAP_WIDTH * TILE_SIZE}" height="${MAP_HEIGHT * TILE_SIZE}"></canvas>
  `
  const canvas = container.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const statusEl = container.querySelector('[data-role="status"]')
  const levelEl = container.querySelector('[data-role="level"]')
  const difficultyButtons = container.querySelectorAll('[data-difficulty]')

  let difficulty = 'easy'
  let player = { ...START }
  let map = []
  let enemies = []
  let enemyCount = STARTING_ENEMIES
  let level = 1
  let gameOver = false

  function generateLevel() {
    // Random walls can cut off the exit, so keep generating until it's reachable.
    let steps
    do {
      map = randomMap()
      steps = stepsFrom(map, START)
    } while (steps[EXIT_POSITION.y][EXIT_POSITION.x] === Infinity)

    const spots = []
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (
          map[y][x] === FLOOR &&
          steps[y][x] > SAFE_DISTANCE &&
          steps[y][x] !== Infinity
        ) {
          spots.push({ x, y })
        }
      }
    }
    const count = Math.min(
      enemyCount,
      Math.floor(spots.length * MAX_ENEMY_SHARE),
    )
    enemies = shuffle(spots)
      .slice(0, count)
      .map((spot) => ({ ...spot, dir: Math.floor(Math.random() * 4) }))
    levelEl.textContent = 'Level: ' + level
  }

  function restartGame() {
    player = { ...START }
    gameOver = false
    enemyCount = STARTING_ENEMIES
    level = 1
    generateLevel()
    statusEl.textContent = 'Find the exit!'
    draw()
  }

  function endGame() {
    statusEl.textContent = 'Game Over!'
    gameOver = true
    draw()
  }

  function setDifficulty(value) {
    if (value === difficulty) return
    difficulty = value
    for (const button of difficultyButtons) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.difficulty === value),
      )
    }
    restartGame()
  }

  function movePlayer(dir) {
    const nx = player.x + DIRECTIONS[dir].dx
    const ny = player.y + DIRECTIONS[dir].dy
    if (map[ny][nx] === WALL) return
    player.x = nx
    player.y = ny
    if (enemies.some((enemy) => enemy.x === nx && enemy.y === ny)) {
      endGame()
      return
    }
    if (map[ny][nx] === EXIT) {
      level++
      enemyCount = Math.ceil(enemyCount * 1.5)
      player = { ...START }
      statusEl.textContent = 'Level Up!'
      generateLevel()
    }
    draw()
  }

  // Hard mode: step along whichever axis the player is farther away on, and
  // try the other axis if a wall is in the way. Walls can still trap a chaser.
  function chaseDirection(enemy) {
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const horizontal = [dx > 0 ? RIGHT : LEFT, dx]
    const vertical = [dy > 0 ? DOWN : UP, dy]
    const order =
      Math.abs(dx) >= Math.abs(dy)
        ? [horizontal, vertical]
        : [vertical, horizontal]
    for (const [dir, distance] of order) {
      if (
        distance !== 0 &&
        map[enemy.y + DIRECTIONS[dir].dy][enemy.x + DIRECTIONS[dir].dx] ===
          FLOOR
      ) {
        return dir
      }
    }
    return null
  }

  function moveEnemies() {
    if (gameOver) return
    for (const enemy of enemies) {
      const dir =
        difficulty === 'hard'
          ? chaseDirection(enemy)
          : Math.floor(Math.random() * 4)
      if (dir === null) continue
      const nx = enemy.x + DIRECTIONS[dir].dx
      const ny = enemy.y + DIRECTIONS[dir].dy
      if (map[ny][nx] !== FLOOR) continue
      enemy.x = nx
      enemy.y = ny
      enemy.dir = dir
      if (nx === player.x && ny === player.y) {
        endGame()
        return
      }
    }
    draw()
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        ctx.fillStyle =
          map[y][x] === WALL ? '#444' : map[y][x] === EXIT ? '#ff0' : '#222'
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
    for (const enemy of enemies) {
      ctx.save()
      ctx.translate(
        enemy.x * TILE_SIZE + TILE_SIZE / 2,
        enemy.y * TILE_SIZE + TILE_SIZE / 2,
      )
      ctx.rotate((enemy.dir * Math.PI) / 2)
      ctx.beginPath()
      ctx.moveTo(0, -TILE_SIZE / 2.2)
      ctx.lineTo(TILE_SIZE / 2.2, TILE_SIZE / 2.2)
      ctx.lineTo(-TILE_SIZE / 2.2, TILE_SIZE / 2.2)
      ctx.closePath()
      ctx.fillStyle = '#f00'
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = '#0f0'
    ctx.beginPath()
    ctx.arc(
      player.x * TILE_SIZE + TILE_SIZE / 2,
      player.y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE / 2.2,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const dir = KEY_DIRECTIONS[e.key.toLowerCase()]
    if (dir === undefined) return
    e.preventDefault()
    if (!gameOver) movePlayer(dir)
  }

  // Tap or click: step one tile toward that spot, along the longer distance.
  // The canvas may be scaled to fit the screen, so convert to canvas pixels.
  function onPointerDown(e) {
    if (gameOver) return
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / canvas.clientWidth
    const gridX = Math.floor(
      ((e.clientX - rect.left - canvas.clientLeft) * scale) / TILE_SIZE,
    )
    const gridY = Math.floor(
      ((e.clientY - rect.top - canvas.clientTop) * scale) / TILE_SIZE,
    )
    const dx = gridX - player.x
    const dy = gridY - player.y
    if (dx === 0 && dy === 0) return
    if (Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? RIGHT : LEFT)
    } else {
      movePlayer(dy > 0 ? DOWN : UP)
    }
  }

  container
    .querySelector('[data-action="restart"]')
    .addEventListener('click', restartGame)
  for (const button of difficultyButtons) {
    button.addEventListener('click', () =>
      setDifficulty(button.dataset.difficulty),
    )
  }
  document.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('pointerdown', onPointerDown)
  restartGame()
  const enemyTimer = setInterval(moveEnemies, ENEMY_STEP_MS)

  return function stop() {
    clearInterval(enemyTimer)
    document.removeEventListener('keydown', onKeyDown)
    container.replaceChildren()
  }
}
