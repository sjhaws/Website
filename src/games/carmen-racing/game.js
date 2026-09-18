// Carmen Racing - 8 Bit Classic
// An endless top-down racer on a three-lane road.
//
// start(container) builds the game inside `container` and returns stop(),
// which removes everything the game added: elements, listeners and the
// animation loop.

import styles from './game.module.css'

const W = 320
const H = 480
const ROAD_W = 120
const ROAD_X = (W - ROAD_W) / 2
const LANE_W = ROAD_W / 3
const CAR_W = 24
const CAR_H = 32
const OBSTACLE_W = 24
const OBSTACLE_H = 32
const FLAG_W = 16
const FLAG_H = 16

// Speeds are in pixels per 1/60 s. Movement is scaled by the real time between
// frames, so the game runs at the same speed on 60 Hz and 120 Hz screens.
const FRAME_MS = 1000 / 60
const OBSTACLE_EVERY_MS = 1000
const FLAG_EVERY_MS = 1500
const SPEED_UP_EVERY_MS = 3000
// Longest gap simulated in one step, e.g. after switching back to the tab.
const MAX_STEP_MS = 100
const SPEEDS = {
  desktop: { start: 4, step: 0.5, max: 12 },
  mobile: { start: 2, step: 0.25, max: 6 },
}

const carImg = new Image()
carImg.src = new URL('./assets/Carmen.webp', import.meta.url).href
const obstacleImg = new Image()
obstacleImg.src = new URL('./assets/car.webp', import.meta.url).href
const treeImg = new Image()
treeImg.src = new URL('./assets/tree.webp', import.meta.url).href

function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    window.innerWidth < 600 ||
    window.innerHeight < 600
  )
}

function randomTreeX(leftSide) {
  return leftSide
    ? Math.random() * (ROAD_X - 24)
    : ROAD_X + ROAD_W + 8 + Math.random() * (W - (ROAD_X + ROAD_W + 32))
}

export function start(container) {
  container.innerHTML = `
    <div class="${styles.game}">
      <button type="button" class="${styles.arrow} ${styles.arrowLeft}" aria-label="Left">←</button>
      <canvas class="${styles.canvas}" width="${W}" height="${H}"></canvas>
      <button type="button" class="${styles.start}">Start</button>
      <button type="button" class="${styles.arrow} ${styles.arrowRight}" aria-label="Right">→</button>
      <div class="${styles.instructions}">
        Use <b class="${styles.key}">←</b> and <b class="${styles.key}">→</b> to steer. Avoid obstacles and collect flags!<br>
        Press <b>Space</b> to start or restart.<br>
        <span class="${styles.small}">On mobile, use the arrow buttons.</span>
      </div>
      <button type="button" class="${styles.restart}">Restart</button>
    </div>
  `
  const canvas = container.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const [leftBtn, startBtn, rightBtn, restartBtn] =
    container.querySelectorAll('button')

  function drawSprite(img, x, y, w, h) {
    if (img.complete) ctx.drawImage(img, x, y, w, h)
  }
  function drawFlag(x, y) {
    ctx.fillStyle = '#00fff7'
    ctx.fillRect(x, y, FLAG_W, FLAG_H)
    ctx.fillStyle = '#fff600'
    ctx.fillRect(x + 4, y + 4, 8, 8)
  }

  let speeds = SPEEDS.desktop
  let player = {
    lane: 1,
    y: H - CAR_H - 12,
    speed: speeds.start,
    alive: true,
    score: 0,
  }
  let obstacles = []
  let flags = []
  let trees = []
  let obstacleTimer = 0
  let flagTimer = 0
  let speedUpTimer = 0
  let gameOver = false
  let started = false
  let frameId = null
  let lastFrameTime = null

  function resetGame() {
    // Decided once per race, so resizing the window mid-race doesn't change it.
    speeds = isMobileDevice() ? SPEEDS.mobile : SPEEDS.desktop
    player = {
      lane: 1,
      y: H - CAR_H - 12,
      speed: speeds.start,
      alive: true,
      score: 0,
    }
    obstacles = []
    flags = []
    trees = []
    for (let i = 0; i < 10; i++) {
      trees.push({ x: randomTreeX(true), y: Math.random() * H })
      trees.push({ x: randomTreeX(false), y: Math.random() * H })
    }
    obstacleTimer = 0
    flagTimer = 0
    speedUpTimer = 0
    gameOver = false
    started = false
    restartBtn.style.display = 'none'
    startBtn.style.display = 'none'
    draw()
  }

  function startRace() {
    started = true
    startBtn.style.display = 'none'
  }

  function update(dt) {
    if (!player.alive || !started) return
    const frames = dt / FRAME_MS
    for (const obs of obstacles) obs.y += player.speed * frames
    for (const flag of flags) flag.y += player.speed * frames
    // Trees move twice as fast as the road, and wrap back to the top.
    for (const tree of trees) {
      tree.y += player.speed * 2 * frames
      if (tree.y > H) {
        tree.y = -32
        tree.x = randomTreeX(tree.x < ROAD_X)
      }
    }
    obstacles = obstacles.filter((o) => o.y < H)
    flags = flags.filter((f) => f.y < H)

    obstacleTimer += dt
    while (obstacleTimer >= OBSTACLE_EVERY_MS) {
      obstacleTimer -= OBSTACLE_EVERY_MS
      obstacles.push({ lane: Math.floor(Math.random() * 3), y: -OBSTACLE_H })
    }
    flagTimer += dt
    while (flagTimer >= FLAG_EVERY_MS) {
      flagTimer -= FLAG_EVERY_MS
      flags.push({ lane: Math.floor(Math.random() * 3), y: -FLAG_H })
    }

    for (const obs of obstacles) {
      if (
        obs.lane === player.lane &&
        obs.y + OBSTACLE_H > player.y &&
        obs.y < player.y + CAR_H
      ) {
        player.alive = false
        gameOver = true
        restartBtn.style.display = 'block'
      }
    }
    for (let i = flags.length - 1; i >= 0; i--) {
      const flag = flags[i]
      if (
        flag.lane === player.lane &&
        flag.y + FLAG_H > player.y &&
        flag.y < player.y + CAR_H
      ) {
        player.score++
        flags.splice(i, 1)
      }
    }

    speedUpTimer += dt
    while (speedUpTimer >= SPEED_UP_EVERY_MS) {
      speedUpTimer -= SPEED_UP_EVERY_MS
      if (player.speed < speeds.max) player.speed += speeds.step
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1fa31f'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#222'
    ctx.fillRect(ROAD_X, 0, ROAD_W, H)
    for (const tree of trees) drawSprite(treeImg, tree.x, tree.y, 24, 32)
    // Lane lines
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(ROAD_X + i * LANE_W, 0)
      ctx.lineTo(ROAD_X + i * LANE_W, H)
      ctx.stroke()
    }
    ctx.setLineDash([])
    for (const flag of flags) {
      drawFlag(ROAD_X + flag.lane * LANE_W + (LANE_W - FLAG_W) / 2, flag.y)
    }
    for (const obs of obstacles) {
      drawSprite(
        obstacleImg,
        ROAD_X + obs.lane * LANE_W + (LANE_W - OBSTACLE_W) / 2,
        obs.y,
        OBSTACLE_W,
        OBSTACLE_H,
      )
    }
    drawSprite(
      carImg,
      ROAD_X + player.lane * LANE_W + (LANE_W - CAR_W) / 2,
      player.y,
      CAR_W,
      CAR_H,
    )
    ctx.fillStyle = '#fff600'
    ctx.font = '16px "Press Start 2P", Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Score: ' + player.score, 12, 28)
    if (gameOver) {
      ctx.fillStyle = '#ff00c8'
      ctx.font = '20px "Press Start 2P", Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10)
      ctx.font = '12px "Press Start 2P", Arial, sans-serif'
      ctx.fillStyle = '#fff600'
      ctx.fillText('Press Space or Restart', W / 2, H / 2 + 20)
    }
  }

  function gameLoop(now) {
    const dt =
      lastFrameTime === null ? 0 : Math.min(now - lastFrameTime, MAX_STEP_MS)
    lastFrameTime = now
    update(dt)
    draw()
    frameId = requestAnimationFrame(gameLoop)
  }

  // One lane per press; direction is -1 (left) or 1 (right).
  function steer(direction) {
    if (!player.alive) return
    player.lane = Math.min(2, Math.max(0, player.lane + direction))
  }

  // Show the on-screen arrows (and Start, until the race starts) on small
  // screens only.
  function updateMobileUI() {
    const isMobile = window.innerWidth < 600 || window.innerHeight < 600
    leftBtn.style.display = isMobile ? 'block' : 'none'
    rightBtn.style.display = isMobile ? 'block' : 'none'
    startBtn.style.display = isMobile && !started ? 'block' : 'none'
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      if (!player.alive) {
        resetGame()
        startRace()
      } else if (!started) {
        startRace()
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      steer(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  // pointerdown covers touch, mouse and pen, and responds before a click would.
  function onPress(button, action) {
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      action()
    })
  }
  onPress(leftBtn, () => steer(-1))
  onPress(rightBtn, () => steer(1))
  onPress(startBtn, () => {
    if (!started) startRace()
  })
  restartBtn.addEventListener('click', () => {
    resetGame()
    startRace()
  })
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', updateMobileUI)
  window.addEventListener('orientationchange', updateMobileUI)

  // Redraw once the sprites arrive, in case they load after the first frame.
  for (const img of [carImg, obstacleImg, treeImg]) {
    if (!img.complete) img.addEventListener('load', draw, { once: true })
  }

  resetGame()
  updateMobileUI()
  frameId = requestAnimationFrame(gameLoop)

  return function stop() {
    cancelAnimationFrame(frameId)
    document.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('resize', updateMobileUI)
    window.removeEventListener('orientationchange', updateMobileUI)
    for (const img of [carImg, obstacleImg, treeImg])
      img.removeEventListener('load', draw)
    container.replaceChildren()
  }
}
