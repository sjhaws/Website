// Nephi Journey (I, Nephi): a Phaser 3 platformer.
//
// start(container) creates the game inside `container` and returns stop(),
// which destroys it. Phaser removes its own canvas and input listeners (all but
// one document visibilitychange listener, which Phaser never removes).

import * as Phaser from 'phaser'
import { SlideControls } from './touchControls.ts'

const GAME_WIDTH = 960
const GAME_HEIGHT = 540
const WORLD_WIDTH = 10000
const WORLD_HEIGHT = 540
const GRAVITY_Y = 1400
const PLAYER_SPEED = 220
const PLAYER_JUMP = 840
// Invincibility now always runs for a fixed window starting the instant the
// game resumes from a scroll popup (see collectScroll), rather than being
// tied to how long the popup happened to stay open.
const INVINCIBILITY_MS = 3000
// Nephi has three hearts, shown under the level's name. Each hit, by an
// enemy or a coconut, costs one (see hurtNephi); losing the last starts the
// journey again from level 1. Every level starts with all three.
const HEARTS = 3
// A hit knocks him back (across and up, in px/s) and he can't walk for a
// moment. Then he blinks for a while, and can't be hurt again until he stops.
const HURT_KNOCKBACK = [300, 380]
const HURT_STAGGER_MS = 300
const HURT_MS = 1500
const HURT_BLINK_MS = 90
// How long "Out of hearts!" shows before the journey starts again.
const OUT_OF_HEARTS_MS = 1800
// A heart in pixel art: X outline, R red, D shade, W shine. Each pixel is
// HEART_PIXEL pixels on screen.
const HEART_ART = [
  '.XX...XX.',
  'XRRX.XRRX',
  'XRWRXRRRX',
  'XRRRRRRDX',
  'XRRRRRRDX',
  '.XRRRRDX.',
  '..XRRDX..',
  '...XDX...',
  '....X....',
]
const HEART_PIXEL = 3
// Colors for a heart he has, and one he's lost.
const HEART_COLORS = {
  heart: { X: 0x2a0b0e, R: 0xe23b44, D: 0xa3222c, W: 0xffd6d6 },
  'heart-lost': { X: 0x2a0b0e, R: 0x55484a, D: 0x453a3c, W: 0x66585a },
}
const ENEMY_SPACING = 300
const ENEMY_RANGE = 20
const LAND_ENEMY_RANGE = ENEMY_RANGE * 6
const ENEMY_SPEED = 55
const ENEMY_SPEED_VARIATION = 0.15
const LEVEL_X_SCALE = 2
// The "platform" texture is generated on a 64x64 canvas but only the top
// PLATFORM_VISUAL_HEIGHT pixels are actually painted (see makeTexture("platform", ...)).
// Sprites default to a 64x64 frame centered on their (x, y), so the visual
// top edge of a platform sits PLATFORM_FRAME_HALF px above its y position.
const PLATFORM_FRAME_HALF = 32
const PLATFORM_VISUAL_HEIGHT = 20
const ENEMY_DISPLAY_WIDTH = 56
const ENEMY_DISPLAY_HEIGHT = 44
const ENEMY_BODY_WIDTH = 40
const ENEMY_BODY_HEIGHT = 34
// Nephi's own sprite/hitbox dimensions (see buildPlayer) - kept here as
// named constants so other things (like the guard sizing below) can be
// defined relative to them instead of duplicating magic numbers.
const PLAYER_DISPLAY_WIDTH = 40
const PLAYER_DISPLAY_HEIGHT = 60
const PLAYER_BODY_WIDTH = 28
const PLAYER_BODY_HEIGHT = 48
// Guards (Level 3) should stand 10% taller than Nephi, both visually and
// in their collision box, while keeping the same width as other enemies.
const GUARD_DISPLAY_HEIGHT = PLAYER_DISPLAY_HEIGHT * 1.1
const GUARD_BODY_HEIGHT = PLAYER_BODY_HEIGHT * 1.1

// Each character's art is one still picture, so its animation is built from
// it when the game loads (see buildFrames): parts of the picture are cut out
// and moved, frame by frame. Positions are in the art's own pixels. Distances
// moved are in pixels on screen, so everything moves by whole pixels and the
// art stays crisp when it's shrunk. Frame 0 is the art as drawn, and each of
// the ANIM_STEPS steps of the loop comes after it, following smooth curves.
const ANIM_STEPS = 8
// Room either side of the art, in pixels on screen, for parts to move into.
const ANIM_MARGIN = 2
const FRAME_STILL = 0
// In the air Nephi holds the step where his front foot is at the top of its
// swing.
const FRAME_MID_AIR = 1 + (ANIM_STEPS * 3) / 4

// Parts that move as a whole: a rectangle of the art (`round`: the oval
// inside it). When one moves, what was behind it shows: nothing, a row of the
// art stretched over the spot (`behindRow`), or, where the art has nothing to
// show, a copy left in place when it moves in the direction `trail` [x, y].

// Walkers: as they step, their feet slide back and forth below the hem of
// their clothes, each lifting as it swings forward; their hands swing
// `swing` pixels the opposite way, rising `raise` pixels when forward; and
// their bodies dip on each stride.
const WALKERS = {
  nephi: {
    key: 'nephi-walk',
    art: 'nephi',
    display: [PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT],
    fps: 20,
    // Room to lean and thrust into a sword swing (see SWORD_POSES).
    margin: 6,
    hemY: 164, // his feet are below this
    feet: [26, 58, 110], // left edge, between the feet, right edge
    stride: 3,
    lift: 3,
    dip: 1,
    hands: [
      // Held out in front. A copy left behind as it swings forward becomes
      // a longer wrist.
      { box: [93, 96, 25, 26], swing: -2, raise: 1, trail: [1, 0] },
      // By his cloak, whose vertical stripes are stretched over its spot.
      { box: [14, 114, 22, 26], swing: 2, raise: 1, behindRow: 141 },
    ],
  },
  guard: {
    key: 'guard-walk',
    art: 'guard',
    display: [ENEMY_DISPLAY_WIDTH, GUARD_DISPLAY_HEIGHT],
    fps: 12,
    hemY: 208,
    feet: [44, 89, 138],
    stride: 3,
    lift: 3,
    dip: 1,
    hands: [
      // The round shield covers his body, so swinging out it leaves a copy.
      { box: [0, 118, 82, 88], round: true, swing: 2, trail: [-1, 0] },
      // The spear, and the hand holding it.
      { box: [138, 10, 26, 236], swing: -2 },
      { box: [117, 130, 21, 30], swing: -2, trail: [1, 0] },
    ],
  },
}

// Crawlers: each part moves along its own curve, `speed` times a loop,
// `phase` of a loop behind the others.
// - `sway`: the rows of a rectangle bend sideways, the top row `bend` pixels,
//   lower rows less, and the bottom row not at all.
// - `box`: a part that moves by up to `move` [x, y] pixels, rising `lift`
//   pixels as it moves right.
// - `wag`: the columns of a rectangle bend up and down, the left column
//   `bend` pixels, columns further right less, and the right one not at all.
// - `hide`: a rectangle left out on some `steps` of the loop.
const CRAWLERS = {
  // Sharks and whales swim tail first on the left, so their tails beat.
  shark: {
    key: 'shark-swim',
    art: 'shark',
    display: [74, 38],
    fps: 10,
    parts: [{ wag: [0, 0, 108, 114], bend: 2 }],
  },
  whale: {
    key: 'whale-swim',
    art: 'whale',
    display: [122, 56],
    fps: 6,
    parts: [{ wag: [0, 0, 180, 168], bend: 3 }],
  },
  snake: {
    key: 'snake-slither',
    art: 'snake',
    display: [ENEMY_DISPLAY_WIDTH, ENEMY_DISPLAY_HEIGHT],
    fps: 10,
    parts: [
      // Its tongue flicks in and out...
      { hide: [138, 40, 26, 14], steps: [2, 3, 6, 7] },
      // ...its raised neck and head sway...
      { sway: [70, 0, 98, 78], bend: 2 },
      // ...and the tip of its tail wags.
      { sway: [138, 58, 30, 50], bend: 1, speed: 2 },
    ],
  },
  scorpion: {
    key: 'scorpion-scuttle',
    art: 'scorpion',
    display: [ENEMY_DISPLAY_WIDTH, ENEMY_DISPLAY_HEIGHT],
    fps: 12,
    parts: [
      // Its tail sways...
      { sway: [0, 0, 86, 76], bend: 2 },
      // ...its legs scuttle, in alternating pairs...
      { box: [0, 126, 14, 17], move: [1, 0], lift: 1, speed: 2 },
      { box: [14, 126, 22, 37], move: [1, 0], lift: 1, speed: 2, phase: 0.25 },
      { box: [36, 126, 20, 37], move: [1, 0], lift: 1, speed: 2 },
      { box: [57, 126, 24, 37], move: [1, 0], lift: 1, speed: 2, phase: 0.25 },
      // ...and its claws open and close, leaving copies so they stay joined
      // to its arms.
      { box: [120, 54, 48, 33], move: [0, -1], trail: [0, -1] },
      { box: [118, 124, 50, 30], move: [0, 1], trail: [0, 1] },
    ],
  },
}

// Each kind of enemy's animation, by the name chooseEnemyTexture gives it.
const ENEMY_ANIMS = {
  shark: CRAWLERS.shark,
  whale: CRAWLERS.whale,
  guard: WALKERS.guard,
  snake: CRAWLERS.snake,
  scorpion: CRAWLERS.scorpion,
}

// A walker standing still: nothing moved.
function stillPose(walker) {
  const still = [0, 0]
  return {
    lean: 0,
    body: 0,
    back: still,
    front: still,
    hands: walker.hands.map(() => still),
  }
}

// How far each part of a walker moves, in pixels on screen, at one step:
// the body `lean`s forward and dips down (`body`), the feet and hands move.
function walkPose(walker, step) {
  const angle = (2 * Math.PI * step) / ANIM_STEPS
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const { stride, lift, dip } = walker
  return {
    lean: 0,
    // Down while the feet are apart, up as they pass.
    body: Math.abs(c) > 0.5 ? dip : 0,
    back: [Math.round(-stride * c), -Math.round(lift * Math.max(0, s))],
    front: [Math.round(stride * c), -Math.round(lift * Math.max(0, -s))],
    hands: walker.hands.map(({ swing, raise = 0 }) => [
      Math.round(swing * c),
      swing * c > Math.abs(swing) / 2 ? -raise : 0,
    ]),
  }
}

function drawPose(pen, walker, pose) {
  const { width, height } = pen
  const [feetLeft, feetSplit, feetRight] = walker.feet
  const hem = walker.hemY
  const below = height - hem
  // The body leans and dips; the hands move with it, and then some.
  const body = pen.toArt([pose.lean, pose.body])

  // Feet first, so clothes hide the top of a lifted foot.
  pen.copy([feetLeft, hem, feetSplit - feetLeft, below], pen.toArt(pose.back))
  pen.copy(
    [feetSplit, hem, feetRight - feetSplit, below],
    pen.toArt(pose.front),
  )
  // Then the rest of the body, including anything beside the feet.
  pen.copy([0, 0, width, hem], body)
  pen.copy([0, hem, feetLeft, below], body)
  pen.copy([feetRight, hem, width - feetRight, below], body)
  // And the hands, swung.
  const hands = pose.hands.map(([x, y]) => pen.toArt([x, y]))
  moveParts(pen, walker.hands, hands, body)
}

function drawCrawlStep(pen, crawler, step) {
  const angle = (2 * Math.PI * step) / ANIM_STEPS
  const turn = ({ speed = 1, phase = 0 }) => speed * angle - 2 * Math.PI * phase
  const { parts } = crawler

  // The art, less anything hidden at this step.
  const source = pen.scratch()
  for (const part of parts) {
    if (part.hide && part.steps.includes(step)) {
      source.getContext('2d').clearRect(...part.hide)
    }
  }
  pen.copy([0, 0, pen.width, pen.height], [0, 0], source)

  for (const part of parts) {
    if (!part.wag) {
      continue
    }
    // Bend its columns, more the further left they are.
    const [x, y, w, h] = part.wag
    const bend = part.bend * Math.cos(turn(part))
    pen.clear(part.wag)
    for (let column = 0; column < w; column++) {
      const weight = ((w - 1 - column) / (w - 1)) ** 1.5
      const dy = pen.toArt([0, Math.round(bend * weight)])[1]
      pen.copy([x + column, y, 1, h], [0, dy], source)
    }
  }

  for (const part of parts) {
    if (!part.sway) {
      continue
    }
    // Bend its rows, more the higher up they are.
    const [x, y, w, h] = part.sway
    const bend = part.bend * Math.cos(turn(part))
    pen.clear(part.sway)
    for (let row = 0; row < h; row++) {
      const weight = ((h - 1 - row) / (h - 1)) ** 1.5
      const dx = pen.toArt([Math.round(bend * weight), 0])[0]
      pen.copy([x, y + row, w, 1], [dx, 0], source)
    }
  }

  const boxes = parts.filter((part) => part.box)
  const offsets = boxes.map((part) => {
    const [moveX, moveY] = part.move
    const c = Math.cos(turn(part))
    const rising = Math.max(0, -Math.sin(turn(part)))
    const lift = Math.round((part.lift ?? 0) * rising)
    return pen.toArt([Math.round(moveX * c), Math.round(moveY * c) - lift])
  })
  moveParts(pen, boxes, offsets, [0, 0], source)
}

// Lifts `parts` off the frame (see "Parts that move as a whole" above), from
// where the body moved them to (`base`), and puts them back moved by
// `offsets` more. All in art pixels.
function moveParts(pen, parts, offsets, base, source = pen.art) {
  const [baseX, baseY] = base
  for (const part of parts) {
    const [x, , w, h] = part.box
    pen.within(part, base, (px, py) => {
      pen.ctx.clearRect(px, py, w, h)
      if (part.behindRow !== undefined) {
        pen.ctx.drawImage(source, x, part.behindRow, w, 1, px, py, w, h)
      }
    })
  }
  parts.forEach((part, i) => {
    const [dx, dy] = offsets[i]
    const [x, y, w, h] = part.box
    const put = (px, py) => pen.ctx.drawImage(source, x, y, w, h, px, py, w, h)
    const [trailX, trailY] = part.trail ?? [0, 0]
    if (dx * trailX + dy * trailY > 0) {
      // The copy stays put only along the direction it trails.
      const trail = [baseX + (trailX ? 0 : dx), baseY + (trailY ? 0 : dy)]
      pen.within(part, trail, put)
    }
    pen.within(part, [baseX + dx, baseY + dy], put)
  })
}

// Makes texture spec.key from the art: frame 0 as drawn, then each step of
// the loop drawn by drawStep(pen, step), then any `extras`, each drawn by
// its own function. Also makes the looping animation spec.key from the
// steps.
function buildFrames(scene, spec, drawStep, extras = []) {
  const { key } = spec
  if (scene.textures.exists(key)) {
    return
  }
  const art = scene.textures.get(spec.art).getSourceImage()
  const { width, height } = art
  // Art pixels per pixel on screen, across and down.
  const unitX = width / spec.display[0]
  const unitY = height / spec.display[1]
  const margin = Math.round((spec.margin ?? ANIM_MARGIN) * unitX)
  const frameWidth = width + 2 * margin
  const steps = [...Array(ANIM_STEPS).keys()]
  const sheet = scene.textures.createCanvas(
    key,
    frameWidth * (1 + ANIM_STEPS + extras.length),
    height,
  )
  const ctx = sheet.getContext()
  ctx.imageSmoothingEnabled = false
  const scratch = document.createElement('canvas')
  scratch.width = width
  scratch.height = height

  const drawFrame = (frame, draw) => {
    const left = frame * frameWidth + margin
    draw({
      ctx,
      art,
      width,
      height,
      toArt: ([x, y]) => [Math.round(x * unitX), Math.round(y * unitY)],
      // Copies the art's rectangle into this frame, moved by [dx, dy].
      copy: ([x, y, w, h], [dx, dy], source = art) =>
        ctx.drawImage(source, x, y, w, h, left + x + dx, y + dy, w, h),
      clear: ([x, y, w, h]) => ctx.clearRect(left + x, y, w, h),
      // Runs draw(x, y) with drawing limited to a part's shape, moved by
      // [dx, dy].
      within: ({ box: [x, y, w, h], round }, [dx, dy], drawPart) => {
        ctx.save()
        ctx.beginPath()
        if (round) {
          const [cx, cy] = [left + x + dx + w / 2, y + dy + h / 2]
          ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI)
        } else {
          ctx.rect(left + x + dx, y + dy, w, h)
        }
        ctx.clip()
        drawPart(left + x + dx, y + dy)
        ctx.restore()
      },
      // A fresh copy of the art to change without touching the original.
      scratch: () => {
        const scratchCtx = scratch.getContext('2d')
        scratchCtx.clearRect(0, 0, width, height)
        scratchCtx.drawImage(art, 0, 0)
        return scratch
      },
    })
    sheet.add(frame, 0, frame * frameWidth, 0, frameWidth, height)
  }

  drawFrame(FRAME_STILL, (pen) => pen.copy([0, 0, width, height], [0, 0]))
  steps.forEach((step) => drawFrame(step + 1, (pen) => drawStep(pen, step)))
  extras.forEach((draw, i) => drawFrame(1 + ANIM_STEPS + i, draw))
  sheet.refresh()

  scene.anims.create({
    key,
    frames: steps.map((step) => ({ key, frame: step + 1 })),
    frameRate: spec.fps,
    repeat: -1,
  })
}

// Animation frames have room either side of the art for moving parts, so
// they're shown that much wider than the character's own display size.
function setAnimSize(sprite, spec) {
  const artWidth = sprite.scene.textures.get(spec.art).getSourceImage().width
  const [width, height] = spec.display
  sprite.setDisplaySize((width * sprite.width) / artWidth, height)
}

// The family's boat on level 6: its size on screen, how far its middle rides
// above the waterline, and its hitbox (the hull and the heads above it, in
// pixels on screen from the art's top left).
const BOAT_DISPLAY = [104, 80]
const BOAT_RIDE = 20
const BOAT_HULL = [12, 40, 80, 28]

// Level 6's sharks and whales cruise back and forth under the water. Every
// so often one near the boat hunts it: it dashes along underneath, following
// the boat, then surges up through the surface and dives again. It stops
// following once it surges (or after SEA_CHASE_MS), so the boat can still
// dodge by turning or stopping at the right moment. Speeds are in pixels a second; `depth` is how far below the
// waterline each cruises, and `hitbox` covers its body, in pixels on screen
// from the art's top left.
const SEA_CREATURES = {
  shark: { speed: 110, rise: 235, depth: [50, 100], hitbox: [12, 12, 56, 14] },
  whale: { speed: 70, rise: 165, depth: [70, 120], hitbox: [18, 14, 98, 30] },
}
// How far each cruises either side of where it starts.
const SEA_RANGE = 280
// It only hunts a boat within this distance, across.
const SEA_REACH = 520
// Milliseconds between hunts.
const SEA_WAIT = [900, 2400]
// The longest it follows the boat before surging.
const SEA_CHASE_MS = 2500
// How far above the waterline the middle of a surging creature gets.
const SEA_BREACH = 8
// How close across it gets before surging up.
const SEA_STRIKE = 70
const SEA_PACE_VARIATION = 0.2

// Level 3's street: a row of buildings Nephi walks past, alternately tall and
// short, with alleys between (see streetLayout). Tall roofs are out of
// jumping reach, so tall buildings have a ladder; short ones can be jumped
// onto, and so can the roofs either side of them. Heights are of the roofs
// above the street.
const STREET = {
  start: 420,
  end: 9300,
  width: [170, 260],
  gap: [70, 140],
  tall: [290, 320],
  short: [150, 195],
}
const ROOF_THICKNESS = 12
const BUILDING_STONES = [
  { wall: 0xb89e76, shade: 0x9a805c, light: 0xd4bf98, dark: 0x4a3826 },
  { wall: 0xa98f68, shade: 0x8c7352, light: 0xc8b08a, dark: 0x433222 },
  { wall: 0xc2aa84, shade: 0xa38c66, light: 0xdcc8a4, dark: 0x54402c },
]
const AWNINGS = [0xa6423a, 0x3f6f8f, 0x6b8f3f]
// How close across Nephi must be to a ladder to climb it.
const LADDER_REACH = 16
const CLIMB_SPEED = 150
// Nephi's climbing sprite sheet (from behind): frame 0 holding on, 1 and 2
// reaching up with one hand and foot and then the other.
const CLIMB_KEY = 'nephi-climb'
const CLIMB_STILL = 0
// Guards and lions hunt Nephi: they chase him when they see him on the
// ground (see updateHunter), each kind at its own speed.
const HUNTER_SIGHT = 380
const HUNTER_LOSE_DISTANCE = 640
const HUNTER_CHASE_SPEED = { guard: 150, lion: 175 }
const HUNTER_PATROL_RANGE = 240
// Three lions prowl the ground on each of levels 2, 4 and 5 (by index).
const LION_LEVELS = [1, 3, 4]
const LION_SPOTS = [0.28, 0.56, 0.84] // of the way across the level
// Lion.webp is a sheet of lion poses, all facing right, with his body in the
// middle of the frame and his feet on the bottom row. Each frame is 76x64
// pixels on screen, drawn at 3x.
const LION = {
  sheet: 'lion',
  display: [76, 64],
  walk: 'lion-walk',
  run: 'lion-run',
}
const LION_FRAMES = {
  stand: 0,
  walk: [1, 2, 3, 4],
  roar: 5,
  // Bounding: a crouching stride, then a leap.
  run: [6, 7],
  sit: 8,
  lyingDown: 9,
}
const LION_WALK_FPS = 8
const LION_RUN_FPS = 7
// His body box, in pixels on screen, from this far below the top of the
// frame: his head and body, not his legs or tail.
const LION_BODY = [46, 30]
const LION_BODY_TOP = 22
// Having spotted Nephi, he roars before he bounds after him.
const LION_ROAR_MS = 450
// Having lost him, he stands and looks around for him.
const LION_LOOK_MS = 700
// Now and then, while patrolling, he sits down for a rest.
const LION_REST_EVERY_MS = [5000, 10000]
const LION_REST_MS = [1500, 3000]
// A lion takes two blows, by sword or stomp (see hitLion). The first knocks
// him this far away, in pixels, with a hop, and he stands dazed for a moment
// before he's back on the prowl; the second beats him.
const LION_KNOCK_DISTANCE = 90
const LION_KNOCK_HOP = 18
const LION_KNOCK_MS = 350
const LION_DAZE_MS = 500

// Level 5 (by index) is a grove of palm trees (see groveLayout), one in ten
// with a monkey in it who throws coconuts at Nephi (see updateMonkeys). A
// coconut that hits him restarts the level, but a swing of his sword knocks
// it away (see batCoconut).
const MONKEY_LEVEL = 4
const PALM_COUNT = 100
const MONKEY_PALMS = 10
// Palms are from 3x their art (156 pixels tall on screen) up to half the
// window's height.
const PALM_HEIGHTS = [156, GAME_HEIGHT / 2]
// Palm.webp is five palm trees, each 37x52 pixels of art with its crown in
// the middle, drawn at 9x; the last two have coconuts. A monkey sits where
// the fronds meet the trunk, 34 pixels of art up.
const PALM = {
  sheet: 'palm',
  art: [37, 52],
  frames: 5,
  withCoconuts: [3, 4],
  perch: 34 / 52, // of the way up
}
// Monkey.webp is a monkey's poses, facing right, each 73x50 pixels on screen
// (drawn at 3x) with his feet in the middle of the bottom row.
const MONKEY = { sheet: 'monkey', display: [73, 50] }
const MONKEY_FRAMES = {
  sit: 0,
  reach: 1,
  hold: 2,
  aim: 3,
  release: 4,
  windUp: 5,
  propel: 6,
  followThrough: 7,
  recover: 8,
  lookOut: 9,
}
// His two throws, overhead and a sidearm lob, pose by pose, each held for
// `ms`, ending with him shading his eyes to see where it went. The coconut
// leaves his hand at `hand`, in pixels on screen from his feet, for him
// facing right.
const MONKEY_THROWS = [
  [
    { pose: 'reach', ms: 280 },
    { pose: 'hold', ms: 300 },
    { pose: 'aim', ms: 420 },
    { pose: 'release', ms: 240, hand: [27, -26.5] },
    { pose: 'recover', ms: 350 },
    { pose: 'lookOut', ms: 600 },
  ],
  [
    { pose: 'reach', ms: 280 },
    { pose: 'hold', ms: 260 },
    { pose: 'windUp', ms: 380 },
    { pose: 'propel', ms: 160, hand: [33.5, -24.5] },
    { pose: 'followThrough', ms: 260 },
    { pose: 'recover', ms: 300 },
    { pose: 'lookOut', ms: 600 },
  ],
]
// He throws when Nephi's this near across, resting between throws.
const MONKEY_RANGE = 520
const MONKEY_REST_MS = [900, 2000]
// Coconut.webp is 11x11 pixels on screen, drawn at 3x.
const COCONUT_SIZE = 11
// A coconut flies for longer the farther it goes, aimed at where Nephi will
// be by then if he keeps going.
const COCONUT_FLIGHT_MS = [650, 1150]
const COCONUT_SPIN = 540 // degrees a second
// A swing knocks away a coconut this near the middle of the blade's sweep
// (half a blade over his fist), in front of him or overhead, from the
// wind-up until the blade comes back up.
const SWORD_BAT_REACH = 42
const SWORD_BAT_MS = 260

// On levels 4 and 5 (by index) Nephi carries Laban's sword, held up in his
// forward fist, and can swing it (see updateSword). Angles are in degrees
// forward of upright; the blade is in pixels on screen from the grip.
const SWORD_LEVELS = [3, 4]
const SWORD_CARRY_ANGLE = 25
// Nephi's poses through a swing, in pixels on screen (see walkPose): his
// hands are his sword fist, then his other hand, swinging the other way for
// balance.
const SWORD_POSES = {
  // Leaning back, the sword pulled up and back.
  windUp: {
    lean: -1,
    body: 0,
    back: [-1, 0],
    front: [1, 0],
    hands: [
      [-3, -4],
      [1, 0],
    ],
  },
  // Lunging in, stepping forward, the fist thrust out.
  strike: {
    lean: 2,
    body: 1,
    back: [-3, 0],
    front: [3, 0],
    hands: [
      [4, 1],
      [-2, 0],
    ],
  },
  // Carried on through, the fist low.
  follow: {
    lean: 2,
    body: 1,
    back: [-3, 0],
    front: [3, 0],
    hands: [
      [3, 4],
      [-2, 1],
    ],
  },
  // Straightening up.
  recover: {
    lean: 1,
    body: 0,
    back: [-1, 0],
    front: [1, 0],
    hands: [
      [1, 1],
      [-1, 0],
    ],
  },
}
const SWORD_POSE_NAMES = Object.keys(SWORD_POSES)
const SWORD_POSE_LIST = Object.values(SWORD_POSES)
// A swing, as keyframes: from `at` milliseconds in, Nephi holds `pose`
// (null: his usual frame) while the sword turns from this keyframe's angle
// to the next's (degrees forward of upright). The blade strikes from the
// strike to the recovery.
const SWORD_SWING = [
  { at: 0, pose: 'windUp', angle: SWORD_CARRY_ANGLE },
  { at: 60, pose: 'strike', angle: -15 },
  { at: 120, pose: 'follow', angle: 100 },
  { at: 190, pose: 'recover', angle: 155 },
  { at: 260, pose: null, angle: 70 },
  { at: 320, pose: null, angle: SWORD_CARRY_ANGLE },
]
const SWORD_STRIKE_MS = [60, 190]
const SWORD_REST_MS = 80 // before it can swing again
const SWORD_BLADE = 26
const SWORD_GRIP_Y = 26.5 / 31 // the grip, as a share of the art's height

// A repeatable stand-in for Math.random (mulberry32), so the street is laid
// out the same every time.
function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Level 5's palm grove, the same every time: PALM_COUNT palms of every kind,
// either way round and of every height (see PALM_HEIGHTS), evenly spread
// with a little jitter. MONKEY_PALMS of them, evenly spread, each in place
// of the nearest other palm, have coconuts and a monkey in, and room between
// the platforms, so none hides a monkey. Taller palms come first, to be drawn
// behind, and those with monkeys last, in front of the rest.
function groveLayout(platforms) {
  const random = seededRandom(5)
  const between = (min, max) => min + (max - min) * random()
  const palm = (x, frame, monkey) => ({
    x,
    frame,
    monkey,
    height: Math.round(between(...PALM_HEIGHTS)),
    flip: random() < 0.5,
  })
  const spacing = WORLD_WIDTH / PALM_COUNT
  const spots = Array.from(
    { length: PALM_COUNT },
    (_, index) => (index + 0.5 + between(-0.3, 0.3)) * spacing,
  )
  const withMonkeys = Array.from({ length: MONKEY_PALMS }, (_, index) => {
    const frame = PALM.withCoconuts[index % PALM.withCoconuts.length]
    const tree = palm(0, frame, true)
    const spot = (WORLD_WIDTH * (index + 1)) / (MONKEY_PALMS + 1)
    const room = palmWidth(tree.height) / 2 + 8
    tree.x = clearOfPlatforms(spot, room, platforms)
    const nearest = spots.reduce(
      (best, x, at) =>
        Math.abs(x - tree.x) < Math.abs(spots[best] - tree.x) ? at : best,
      0,
    )
    spots.splice(nearest, 1)
    return tree
  })
  const others = spots.map((x) =>
    palm(x, Math.floor(random() * PALM.frames), false),
  )
  others.sort((a, b) => b.height - a.height)
  return [...others, ...withMonkeys]
}

// How wide a palm this tall is, on screen.
function palmWidth(height) {
  return (height * PALM.art[0]) / PALM.art[1]
}

// The nearest place to `x` with `room` either side clear of the platforms.
function clearOfPlatforms(x, room, platforms) {
  const clear = (at) =>
    platforms.every((platform) => {
      const tiles = Math.max(1, Math.ceil(platform.width / 64))
      const left = platform.x - 32
      const right = left + tiles * 64
      return at + room <= left || at - room >= right
    })
  for (let shift = 0; shift <= 600; shift += 20) {
    if (clear(x + shift)) {
      return x + shift
    }
    if (clear(x - shift)) {
      return x - shift
    }
  }
  return x
}

// Level 3's buildings, left to right: alternately tall, with a ladder near
// one end or the other, and short.
function streetLayout() {
  const random = seededRandom(1)
  const between = ([min, max]) => Math.round(min + random() * (max - min))
  const buildings = []
  let x = STREET.start
  for (let i = 0; ; i++) {
    const width = between(STREET.width)
    if (x + width > STREET.end) {
      return buildings
    }
    const tall = i % 2 === 0
    buildings.push({
      x,
      width,
      height: between(tall ? STREET.tall : STREET.short),
      ladderX: tall ? (i % 4 === 0 ? x + 30 : x + width - 30) : undefined,
    })
    x += width + between(STREET.gap)
  }
}

// Scroll popup: the box auto-sizes around whatever text it's given (see
// fitScrollPopupText/layoutScrollPopup) instead of using a fixed height,
// since scroll messages range from a single short line up to several
// full verses of scripture.
const SCROLL_POPUP_TOP = 118
const SCROLL_POPUP_WIDTH = 640
const SCROLL_POPUP_WRAP_WIDTH = 560
const SCROLL_POPUP_PADDING_TOP = 14
const SCROLL_POPUP_PADDING_BOTTOM = 14
const SCROLL_POPUP_TITLE_GAP = 8
const SCROLL_POPUP_BUTTON_GAP = 14
const SCROLL_POPUP_BASE_FONT = 17
const SCROLL_POPUP_MIN_FONT = 11
const SCROLL_POPUP_MAX_TEXT_HEIGHT = 260

// Story/ending panel: same idea as the scroll popup above, but here the
// story text ranges from a one-line summary up to a full multi-paragraph
// scripture passage (Level 2's is 1000+ characters with several verse
// breaks), so it needs several fallback levels - shrink the font, then
// tighten line spacing, then tighten paragraph spacing - before finally
// just accepting whatever fits so nothing ever overlaps.
const STORY_PANEL_MAX_WIDTH = 860
const STORY_PANEL_SIDE_PADDING = 34
const STORY_PANEL_TOP_BOTTOM_PADDING = 24
const STORY_TOP_MARGIN = 18
const STORY_BOTTOM_MARGIN = 46
const STORY_ELEMENT_GAP = 12
const STORY_TIGHT_ELEMENT_GAP = 6
const STORY_NAME_FONT = 20
const STORY_TITLE_FONT = 28
const STORY_BUTTON_FONT = 22
const STORY_HINT_FONT = 13
const STORY_BASE_FONT = 19
const STORY_MIN_FONT = 12

const LEVEL_LAYOUTS = [
  {
    platforms: [
      { x: 360, y: 404, width: 160 },
      { x: 980, y: 372, width: 128 },
      { x: 1500, y: 340, width: 192 },
      { x: 2100, y: 392, width: 160 },
      { x: 2840, y: 350, width: 192 },
      { x: 3520, y: 384, width: 128 },
      { x: 4200, y: 332, width: 192 },
    ],
    enemies: [320, 700, 1060, 1420, 1800, 2220, 2640, 3080, 3500, 3940, 4380],
  },
  {
    platforms: [
      { x: 440, y: 386, width: 128 },
      { x: 920, y: 352, width: 160 },
      { x: 1360, y: 318, width: 192 },
      { x: 1880, y: 382, width: 160 },
      { x: 2620, y: 344, width: 192 },
      { x: 3320, y: 378, width: 160 },
      { x: 4040, y: 336, width: 192 },
      { x: 4520, y: 392, width: 128 },
    ],
    enemies: [
      260, 620, 980, 1340, 1700, 2100, 2500, 2940, 3380, 3820, 4280, 4680,
    ],
  },
  {
    // Buildings instead: see STREET.
    platforms: [],
    enemies: [
      420, 720, 1100, 1440, 1820, 2140, 2500, 2860, 3240, 3620, 4020, 4440,
    ],
  },
  {
    platforms: [
      { x: 420, y: 396, width: 160 },
      { x: 860, y: 356, width: 128 },
      { x: 1340, y: 324, width: 160 },
      { x: 1980, y: 388, width: 128 },
      { x: 2660, y: 342, width: 192 },
      { x: 3320, y: 374, width: 160 },
      { x: 3960, y: 330, width: 192 },
      { x: 4500, y: 384, width: 128 },
    ],
    enemies: [340, 760, 1180, 1580, 2020, 2460, 2880, 3300, 3740, 4180, 4620],
  },
  {
    platforms: [
      { x: 420, y: 388, width: 128 },
      { x: 980, y: 344, width: 160 },
      { x: 1540, y: 380, width: 128 },
      { x: 2200, y: 336, width: 192 },
      { x: 2860, y: 374, width: 160 },
      { x: 3520, y: 322, width: 192 },
      { x: 4240, y: 356, width: 160 },
    ],
    enemies: [300, 700, 1120, 1520, 1960, 2420, 2880, 3360, 3860, 4380],
  },
  {
    platforms: [
      { x: 360, y: 402, width: 128 },
      { x: 860, y: 360, width: 160 },
      { x: 1320, y: 388, width: 128 },
      { x: 1840, y: 344, width: 160 },
      { x: 2420, y: 392, width: 128 },
      { x: 3040, y: 352, width: 160 },
      { x: 3720, y: 384, width: 160 },
      { x: 4380, y: 338, width: 192 },
    ],
    enemies: [260, 620, 980, 1360, 1800, 2260, 2720, 3200, 3680, 4180, 4640],
  },
]

const LEVEL_SCROLL_MESSAGES = [
  [
    '1Nephi 2:1-2\n\n1 For behold, it came to pass that the Lord spake unto my father, yea, even in a dream, and said unto him: Blessed art thou, Lehi, because of the things which thou hast done; and because thou hast been faithful and declared unto this people the things which I commanded thee, behold, they seek to take away thy life.\n\n2 And it came to pass that the Lord commanded my father, even in a dream, that he should take his family and depart into the wilderness.',
    '1 Nephi 2:3-4\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4  And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.',
    '1 Nephi 2: 5-6\n\n5 And he came down by the borders near the shore of the Red Sea; and he traveled in the wilderness in the borders which are nearer the Red Sea; and he did travel in the wilderness with his family, which consisted of my mother, Sariah, and my elder brothers, who were Laman, Lemuel, and Sam.\n\n6 And it came to pass that when he had traveled three days in the wilderness, he pitched his tent in a valley by the side of a river of water.',
  ],
  [
    '1 Nephi 3:9-11\n\n9 And I, Nephi, and my brethren took our journey in the wilderness, with our tents, to go up to the land of Jerusalem.\n\n10 And it came to pass that when we had gone up to the land of Jerusalem, I and my brethren did consult one with another.\n\n11 And we cast lots—who of us should go in unto the house of Laban. And it came to pass that the lot fell upon Laman; and Laman went in unto the house of Laban, and he talked with him as he sat in his house.',
    '1 Nephi 3:11-13\n\n11 And we cast lots—who of us should go in unto the house of Laban. And it came to pass that the lot fell upon Laman; and Laman went in unto the house of Laban, and he talked with him as he sat in his house.\n\n12 And he desired of Laban the records which were engraven upon the plates of brass, which contained the genealogy of my father.\n\n13 And behold, it came to pass that Laban was angry, and thrust him out from his presence; and he would not that he should have the records. Wherefore, he said unto him: Behold thou art a robber, and I will slay thee.',
    '1 Nephi 3:24-26\n\n24 And it came to pass that we went in unto Laban, and desired him that he would give unto us the records which were engraven upon the plates of brass, for which we would give unto him our gold, and our silver, and all our precious things.\n\n25 And it came to pass that when Laban saw our property, and that it was exceedingly great, he did lust after it, insomuch that he thrust us out, and sent his servants to slay us, that he might obtain our property.\n\n26 And it came to pass that we did flee before the servants of Laban, and we were obliged to leave behind our property, and it fell into the hands of Laban.',
  ],
  [
    '1 Nephi 4:5-6\n\n5 And it was by night; and I caused that they should hide themselves without the walls. And after they had hid themselves, I, Nephi, crept into the city and went forth towards the house of Laban. 6 And I was led by the Spirit, not knowing beforehand the things which I should do.',
    '1 Nephi 4:7-9\n\n7 Nevertheless I went forth, and as I came near unto the house of Laban I beheld a man, and he had fallen to the earth before me, for he was drunken with wine. 8 And when I came to him I found that it was Laban./n/n9 And I beheld his sword, and I drew it forth from the sheath thereof; and the hilt thereof was of pure gold, and the workmanship thereof was exceedingly fine, and I saw that the blade thereof was of the most precious steel.',
    '1 Nephi 4:10-11\n\n10 And it came to pass that I was constrained by the Spirit that I should kill Laban; but I said in my heart: Never at any time have I shed the blood of man. And I shrunk and would that I might not slay him.\n\n11 And the Spirit said unto me again: Behold the Lord hath delivered him into thy hands. Yea, and I also knew that he had sought to take away mine own life; yea, and he would not hearken unto the commandments of the Lord; and he also had taken away our property.',
  ],
  [
    '1 Nephi 5:1-2\n\n1 And it came to pass that after we had come down into the wilderness unto our father, behold, he was filled with joy, and also my mother, Sariah, was exceedingly glad, for she truly had mourned because of us.\n\n2 For she had supposed that we had perished in the wilderness; and she also had complained against my father, telling him that he was a visionary man; saying: Behold thou hast led us forth from the land of our inheritance, and my sons are no more, and we perish in the wilderness.',
    '1 Nephi 5:10-12\n\n10 And after they had given thanks unto the God of Israel, my father, Lehi, took the records which were engraven upon the plates of brass, and he did search them from the beginning.\n\n11 And he beheld that they did contain the five books of Moses, which gave an account of the creation of the world, and also of Adam and Eve, who were our first parents;\n\n12 And also a record of the Jews from the beginning, even down to the commencement of the reign of Zedekiah, king of Judah;',
    '1 Nephi 5:17-19\n\n17 And now when my father saw all these things, he was filled with the Spirit, and began to prophesy concerning his seed—\n\n18 That these plates of brass should go forth unto all nations, kindreds, tongues, and people who were of his seed.\n\n19 Wherefore, he said that these plates of brass should never perish; neither should they be dimmed any more by time. And he prophesied many things concerning his seed.',
  ],
  [
    '1 Nephi 17:7-8\n\n7 And it came to pass that after I, Nephi, had been in the land of Bountiful for the space of many days, the voice of the Lord came unto me, saying: Arise, and get thee into the mountain. And it came to pass that I arose and went up into the mountain, and cried unto the Lord.\n\n8 And it came to pass that the Lord spake unto me, saying: Thou shalt construct a ship, after the manner which I shall show thee, that I may carry thy people across these waters.',
    '1 Nephi 17:16-18\n\n16 And it came to pass that I did make tools of the ore which I did molten out of the rock.\n\n17 And when my brethren saw that I was about to build a ship, they began to murmur against me, saying: Our brother is a fool, for he thinketh that he can build a ship; yea, and he also thinketh that he can cross these great waters.\n\n18 And thus my brethren did complain against me, and were desirous that they might not labor, for they did not believe that I could build a ship; neither would they believe that I was instructed of the Lord.',
    '1 Nephi 17:50-51\n\n50 And I said unto them: If God had commanded me to do all things I could do them. If he should command me that I should say unto this water, be thou earth, it should be earth; and if I should say it, it would be done.\n\n51 And now, if the Lord has such great power, and has wrought so many miracles among the children of men, how is it that he cannot instruct me, that I should build a ship?',
  ],
  [
    '1 Nephi 18:8-9\n\n8 And it came to pass after we had all gone down into the ship, and had taken with us our provisions and things which had been commanded us, we did put forth into the sea and were driven forth before the wind towards the promised land.\n\n9 And after we had been driven forth before the wind for the space of many days, behold, my brethren and the sons of Ishmael and also their wives began to make themselves merry, insomuch that they began to dance, and to sing, and to speak with much rudeness, yea, even that they did forget by what power they had been brought thither; yea, they were lifted up unto exceeding rudeness.',
    '1 Nephi 18:12-14\n\n12 And it came to pass that after they had bound me insomuch that I could not move, the compass, which had been prepared of the Lord, did cease to work.\n\n13 Wherefore, they knew not whither they should steer the ship, insomuch that there arose a great storm, yea, a great and terrible tempest, and we were driven back upon the waters for the space of three days; and they began to be frightened exceedingly lest they should be drowned in the sea; nevertheless they did not loose me.\n\n14 And on the fourth day, which we had been driven back, the tempest began to be exceedingly sore.',
    '1 Nephi 18:15-16\n\n15 And it came to pass that we were about to be swallowed up in the depths of the sea. And after we had been driven back upon the waters for the space of four days, my brethren began to see that the judgments of God were upon them, and that they must perish save that they should repent of their iniquities; wherefore, they came unto me, and loosed the bands which were upon my wrists, and behold they had swollen exceedingly; and also mine ankles were much swollen, and great was the soreness thereof.\n\n16 Nevertheless, I did look unto my God, and I did praise him all the day long; and I did not murmur against the Lord because of mine afflictions.',
  ],
]

const LEVELS = [
  {
    name: 'Level 1',
    title: 'Leaving Jerusalem',
    story:
      '1 Nephi 2:1-4\n\n1 For behold, it came to pass that the Lord spake unto my father, yea, even in a dream, and said unto him: Blessed art thou Lehi, because of the things which thou hast done; and because thou hast been faithful and declared unto this people the things which I commanded thee, behold, they seek to take away thy life.\n\n2 And it came to pass that the Lord commanded my father, even in a dream, that he should take his family and depart into the wilderness.\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4 And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.',
    theme: {
      skyTop: 0x3b2f2f,
      skyBottom: 0x8b6d4d,
      ground: 0x7c5734,
      groundTop: 0x9f7b4a,
      accent: 0xe0c18a,
    },
  },
  {
    name: 'Level 2',
    title: 'Back to Jerusalem',
    story:
      '1 Nephi 3:1-7\n\n1 And it came to pass that I, Nephi, returned from speaking with the Lord, to the tent of my father.\n\n2 And it came to pass that he spake unto me, saying: Behold I have dreamed a dream, in the which the Lord hath commanded me that thou and thy brethren shall return to Jerusalem.\n\n3 For behold, Laban hath the record of the Jews and also a genealogy of my forefathers, and they are engraven upon plates of brass.\n\n4 Wherefore, the Lord hath commanded me that thou and thy brothers should go unto the house of Laban, and seek the records, and bring them down hither into the wilderness.\n\n5 And now, behold thy brothers murmur, saying it is a hard thing which I have required of them; but behold I have not required it of them, but it is a commandment of the Lord.\n\n6 Therefore go, my son, and thou shalt be favored of the Lord, because thou hast not murmured.\n\n7 And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.',
    theme: {
      skyTop: 0x26364d,
      skyBottom: 0xb28a58,
      ground: 0x745133,
      groundTop: 0xa6814f,
      accent: 0xe9dfb6,
    },
  },
  {
    name: 'Level 3',
    title: 'The Streets of Jerusalem',
    story:
      '1 Nephi 4:1-4\n\n1 And it came to pass that I spake unto my brethren, saying: Let us go up again unto Jerusalem, and let us be faithful in keeping the commandments of the Lord; for behold he is mightier than all the earth, then why not mightier than Laban and his fifty, yea, or even than his tens of thousands?\n\n2 Therefore let us go up; let us be strong like unto Moses; for he truly spake unto the waters of the Red Sea and they divided hither and thither, and our fathers came through, out of captivity, on dry ground, and the armies of Pharaoh did follow and were drowned in the waters of the Red Sea.\n\n3 Now behold ye know that this is true; and ye also know that an angel hath spoken unto you; wherefore can ye doubt? Let us go up; the Lord is able to deliver us, even as our fathers, and to destroy Laban, even as the Egyptians.\n\n4 Now when I had spoken these words, they were yet wroth, and did still continue to murmur; nevertheless they did follow me up until we came without the walls of Jerusalem.',
    theme: {
      skyTop: 0x233148,
      skyBottom: 0x6f8db6,
      ground: 0x5d5149,
      groundTop: 0x8b7a68,
      accent: 0xf2d7a0,
    },
  },
  {
    name: 'Level 4',
    title: 'Return to the Family',
    story:
      '1 Nephi 4:38\n\n38 And it came to pass that we took the plates of brass and the servant of Laban, and departed into the wilderness, and journeyed unto the tent of our father.',
    theme: {
      skyTop: 0x3d2e2c,
      skyBottom: 0x9a7655,
      ground: 0x725034,
      groundTop: 0x9d7441,
      accent: 0xd9b98f,
    },
  },
  {
    name: 'Level 5',
    title: 'The Coastal Paradise',
    story:
      '1 Nephi 5:1-4\n\n1 And it came to pass that we journeyed in the wilderness, and we were led by the Spirit of the Lord.\n\n2 And it came to pass that we did find the land of promise, and we did pitch our tents in the land of our inheritance.\n\n3 And it came to pass that we did build a house, and we did call it by the name of our father.\n\n4 And it came to pass that we did live in the land of our inheritance, and we did prosper in the land.',
    theme: {
      skyTop: 0x0f5f7d,
      skyBottom: 0x9bd7d8,
      ground: 0x65745f,
      groundTop: 0x9ab29d,
      accent: 0xfff1c9,
    },
  },
  {
    name: 'Level 6',
    title: 'Across the Ocean',
    story:
      '1 Nephi 18:2-6\n\n2 Now I, Nephi, did not work the timbers after the manner which was learned by men, neither did I build the ship after the manner of men; but I did build it after the manner which the Lord had shown unto me; wherefore, it was not after the manner of men.\n\n3 And I, Nephi, did go into the mount oft, and I did pray oft unto the Lord; wherefore the Lord showed unto me great things.\n\n4 And it came to pass that after I had finished the ship, according to the word of the Lord, my brethren beheld that it was good, and that the workmanship thereof was exceedingly fine; wherefore, they did humble themselves again before the Lord.\n\n5 And it came to pass that the voice of the Lord came unto my father, that we should arise and go down into the ship.\n\n6 And it came to pass that on the morrow, after we had prepared all things, much fruits and meat from the wilderness, and honey in abundance, and provisions according to that which the Lord had commanded us, we did go down into the ship, with all our loading and our seeds, and whatsoever thing we had brought with us, every one according to his age; wherefore, we did all go down into the ship, with our wives and our children.',
    theme: {
      skyTop: 0x05324d,
      skyBottom: 0x4da3d4,
      ground: 0x38526a,
      groundTop: 0x5c7994,
      accent: 0xc9f2ff,
    },
  },
]

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    this.load.image(
      'nephi',
      new URL('./assets/Nephi.webp', import.meta.url).href,
    )
    this.load.image(
      'snake',
      new URL('./assets/Snake.webp', import.meta.url).href,
    )
    this.load.image(
      'scorpion',
      new URL('./assets/Scorpion.webp', import.meta.url).href,
    )
    this.load.image(
      'scroll',
      new URL('./assets/Scroll.webp', import.meta.url).href,
    )
    this.load.image('tent', new URL('./assets/Tent.webp', import.meta.url).href)
    this.load.image('ship', new URL('./assets/Ship.webp', import.meta.url).href)
    this.load.spritesheet(
      LION.sheet,
      new URL('./assets/Lion.webp', import.meta.url).href,
      { frameWidth: LION.display[0] * 3, frameHeight: LION.display[1] * 3 },
    )
    this.load.image(
      'sword',
      new URL('./assets/Sword.webp', import.meta.url).href,
    )
    this.load.spritesheet(
      PALM.sheet,
      new URL('./assets/Palm.webp', import.meta.url).href,
      { frameWidth: PALM.art[0] * 9, frameHeight: PALM.art[1] * 9 },
    )
    this.load.spritesheet(
      MONKEY.sheet,
      new URL('./assets/Monkey.webp', import.meta.url).href,
      { frameWidth: MONKEY.display[0] * 3, frameHeight: MONKEY.display[1] * 3 },
    )
    this.load.image(
      'coconut',
      new URL('./assets/Coconut.webp', import.meta.url).href,
    )
    this.load.spritesheet(
      CLIMB_KEY,
      new URL('./assets/NephiClimb.webp', import.meta.url).href,
      // The same size as his walk frames, so his hitbox stays put.
      { frameWidth: 156, frameHeight: 187 },
    )
    this.load.image(
      'shark',
      new URL('./assets/Shark.webp', import.meta.url).href,
    )
    this.load.image(
      'whale',
      new URL('./assets/Whale.webp', import.meta.url).href,
    )
    this.load.image('city', new URL('./assets/City.webp', import.meta.url).href)
    this.load.image(
      'guard',
      new URL('./assets/Guard.webp', import.meta.url).href,
    )
    this.load.image(
      'laban',
      new URL('./assets/Laban.webp', import.meta.url).href,
    )

    this.load.on('loaderror', (file) => {
      console.error(
        `[Nephi Journey] Failed to load "${file.key}" from "${file.src}". Check that it exists in the assets folder next to game.js (names are case-sensitive).`,
      )
    })
  }

  create() {
    this.buildTextures()
    for (const walker of Object.values(WALKERS)) {
      const poses = walker === WALKERS.nephi ? SWORD_POSE_LIST : []
      buildFrames(
        this,
        walker,
        (pen, step) => drawPose(pen, walker, walkPose(walker, step)),
        poses.map((pose) => (pen) => drawPose(pen, walker, pose)),
      )
    }
    for (const [key, frames, frameRate] of [
      [LION.walk, LION_FRAMES.walk, LION_WALK_FPS],
      [LION.run, LION_FRAMES.run, LION_RUN_FPS],
    ]) {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map((frame) => ({ key: LION.sheet, frame })),
          frameRate,
          repeat: -1,
        })
      }
    }
    if (!this.anims.exists(CLIMB_KEY)) {
      this.anims.create({
        key: CLIMB_KEY,
        frames: [1, 0, 2, 0].map((frame) => ({ key: CLIMB_KEY, frame })),
        frameRate: 8,
        repeat: -1,
      })
    }
    for (const crawler of Object.values(CRAWLERS)) {
      buildFrames(this, crawler, (pen, step) =>
        drawCrawlStep(pen, crawler, step),
      )
    }
    this.scene.start('StoryScene', { levelIndex: 0 })
  }

  buildTextures() {
    const makeTexture = (key, draw) => {
      if (this.textures.exists(key)) {
        return
      }
      const g = this.add.graphics()
      draw(g)
      g.generateTexture(key, 64, 64)
      g.destroy()
    }

    makeTexture('ground', (g) => {
      g.fillStyle(0x875c34, 1)
      g.fillRect(0, 0, 64, 64)
      g.fillStyle(0xb58244, 1)
      g.fillRect(0, 0, 64, 10)
      g.fillStyle(0x5d3f24, 1)
      g.fillRect(0, 50, 64, 14)
      g.lineStyle(2, 0x9e744a, 0.35)
      g.strokeRect(2, 2, 60, 60)
    })

    makeTexture('platform', (g) => {
      g.fillStyle(0x8d6540, 1)
      g.fillRect(0, 0, 64, 20)
      g.fillStyle(0xbaa06d, 1)
      g.fillRect(0, 0, 64, 5)
    })

    for (const [key, colors] of Object.entries(HEART_COLORS)) {
      if (this.textures.exists(key)) {
        continue
      }
      const g = this.add.graphics()
      HEART_ART.forEach((row, y) => {
        ;[...row].forEach((pixel, x) => {
          if (colors[pixel] !== undefined) {
            g.fillStyle(colors[pixel], 1)
            g.fillRect(
              x * HEART_PIXEL,
              y * HEART_PIXEL,
              HEART_PIXEL,
              HEART_PIXEL,
            )
          }
        })
      })
      g.generateTexture(
        key,
        HEART_ART[0].length * HEART_PIXEL,
        HEART_ART.length * HEART_PIXEL,
      )
      g.destroy()
    }

    makeTexture('goal', (g) => {
      g.fillStyle(0x2b1d14, 1)
      g.fillRect(28, 6, 8, 52)
      g.fillStyle(0xf2c14e, 1)
      g.fillRoundedRect(20, 10, 30, 18, 4)
      g.fillStyle(0xe6edf4, 1)
      g.fillRect(22, 16, 26, 4)
      g.fillStyle(0x8a5d2e, 1)
      g.fillRect(14, 20, 12, 12)
      g.fillRect(52, 20, 12, 12)
    })

    makeTexture('goal-tent', (g) => {
      g.fillStyle(0xd9b98f, 1)
      g.fillTriangle(8, 52, 32, 10, 56, 52)
      g.fillStyle(0x8d6540, 1)
      g.fillRect(28, 32, 8, 20)
      g.lineStyle(3, 0x6b4a2f, 1)
      g.strokeTriangle(8, 52, 32, 10, 56, 52)
    })

    makeTexture('goal-shore', (g) => {
      g.fillStyle(0xc9f2ff, 1)
      g.fillEllipse(32, 42, 36, 14)
      g.fillStyle(0x9ab29d, 1)
      g.fillTriangle(14, 46, 32, 16, 50, 46)
      g.fillStyle(0xf2c14e, 1)
      g.fillCircle(48, 20, 8)
    })

    makeTexture('goal-boat', (g) => {
      g.fillStyle(0x5c7994, 1)
      g.fillTriangle(6, 48, 58, 48, 50, 30)
      g.fillStyle(0xc9f2ff, 1)
      g.fillRect(30, 10, 4, 34)
      g.fillTriangle(32, 12, 50, 28, 32, 28)
      g.lineStyle(3, 0x2c4054, 1)
      g.strokeTriangle(6, 48, 58, 48, 50, 30)
    })
  }
}

class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene')
  }

  create(data) {
    const levelIndex = data.levelIndex ?? 0
    const level = LEVELS[levelIndex]
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x10141a)

    const panelWidth = Math.min(STORY_PANEL_MAX_WIDTH, width - 40)
    const wrapWidth = panelWidth - STORY_PANEL_SIDE_PADDING * 2

    const panel = this.add
      .rectangle(width / 2, height / 2, panelWidth, 360, 0x101820, 0.92)
      .setStrokeStyle(4, 0x5a6d7f, 1)

    // All content pieces are created with origin (0.5, 0) - centered
    // horizontally, anchored at their own TOP edge - so they can be
    // stacked top-to-bottom purely from measured heights, with no
    // hardcoded offsets that long text could blow past.
    const nameText = this.add
      .text(width / 2, 0, level.name, {
        fontFamily: 'Verdana',
        fontSize: `${STORY_NAME_FONT}px`,
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)

    const titleText = this.add
      .text(width / 2, 0, level.title, {
        fontFamily: 'Verdana',
        fontSize: `${STORY_TITLE_FONT}px`,
        color: '#f7edd9',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: wrapWidth },
      })
      .setOrigin(0.5, 0)

    const storyText = this.add
      .text(width / 2, 0, level.story, {
        fontFamily: 'Verdana',
        fontSize: `${STORY_BASE_FONT}px`,
        color: '#d7e2ea',
        align: 'center',
        wordWrap: { width: wrapWidth },
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0)

    const startButton = this.add
      .text(width / 2, 0, 'Start', {
        fontFamily: 'Verdana',
        fontSize: `${STORY_BUTTON_FONT}px`,
        color: '#111',
        backgroundColor: '#f2c14e',
        padding: { left: 22, right: 22, top: 10, bottom: 10 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })

    const touchScreen = window.matchMedia('(pointer: coarse)').matches
    const onShip = levelIndex === 5
    const withLadders = levelIndex === 2
    const withSword = SWORD_LEVELS.includes(levelIndex)
    const howToPlay = touchScreen
      ? onShip
        ? 'Slide a finger left or right to steer.'
        : withLadders
          ? 'Slide a finger to walk, and up or down at a ladder to climb. Tap to jump.'
          : withSword
            ? 'Slide a finger to walk. Tap to jump, and flick down to swing your sword.'
            : 'Slide a finger to walk. Tap or flick up to jump.'
      : onShip
        ? 'Use the arrow keys to steer.'
        : withLadders
          ? 'Use the arrow keys to move and climb ladders, and Space to jump.'
          : withSword
            ? 'Use the arrow keys to move, Space to jump, and X to swing your sword.'
            : 'Use the arrow keys to move and Space to jump.'
    const warning =
      levelIndex === MONKEY_LEVEL
        ? '\nMonkeys throw coconuts: dodge them, or knock them away with your sword.'
        : ''
    const hint = this.add
      .text(width / 2, 0, howToPlay + warning, {
        fontFamily: 'Verdana',
        fontSize: `${STORY_HINT_FONT}px`,
        color: '#9fb3c8',
        align: 'center',
      })
      .setOrigin(0.5, 0)

    const maxContentHeight =
      height -
      STORY_TOP_MARGIN -
      STORY_BOTTOM_MARGIN -
      STORY_PANEL_TOP_BOTTOM_PADDING * 2

    const measureTotalHeight = (gap) =>
      nameText.height +
      gap +
      titleText.height +
      gap +
      storyText.height +
      gap +
      startButton.height +
      gap +
      hint.height

    // Stage 1: shrink the story font down to its floor.
    let storyFontSize = STORY_BASE_FONT
    while (
      measureTotalHeight(STORY_ELEMENT_GAP) > maxContentHeight &&
      storyFontSize > STORY_MIN_FONT
    ) {
      storyFontSize -= 1
      storyText.setFontSize(storyFontSize)
    }

    // Stage 2: still too tall (typically only for the longest scripture
    // passages) - tighten the line spacing.
    if (measureTotalHeight(STORY_ELEMENT_GAP) > maxContentHeight) {
      storyText.setLineSpacing(3)
    }

    // Stage 3: still too tall - the gaps between paragraphs in the source
    // text (blank lines) are costing as much vertical space as several
    // lines of prose. Collapse them to single line breaks; this keeps
    // every word but stops each verse from reserving a full blank line.
    let gap = STORY_ELEMENT_GAP
    if (measureTotalHeight(gap) > maxContentHeight) {
      storyText.setText(level.story.replace(/\n{2,}/g, '\n'))
      gap = STORY_TIGHT_ELEMENT_GAP
    }

    // Whatever the result, lay everything out top-to-bottom from the
    // measured heights so nothing ever overlaps, even in the worst case.
    const totalHeight = measureTotalHeight(gap)
    const panelHeight = Math.min(
      height - STORY_TOP_MARGIN * 2,
      totalHeight + STORY_PANEL_TOP_BOTTOM_PADDING * 2,
    )
    panel.setSize(panelWidth, panelHeight)
    panel.setPosition(width / 2, height / 2)

    let cursorY = height / 2 - panelHeight / 2 + STORY_PANEL_TOP_BOTTOM_PADDING
    nameText.setPosition(width / 2, cursorY)
    cursorY += nameText.height + gap
    titleText.setPosition(width / 2, cursorY)
    cursorY += titleText.height + gap
    storyText.setPosition(width / 2, cursorY)
    cursorY += storyText.height + gap
    startButton.setPosition(width / 2, cursorY)
    cursorY += startButton.height + gap
    hint.setPosition(width / 2, cursorY)

    const startGame = () => {
      this.scene.start('GameScene', { levelIndex })
    }

    startButton.on('pointerdown', startGame)
    this.input.keyboard.once('keydown-ENTER', startGame)
    this.input.keyboard.once('keydown-SPACE', startGame)

    this.add
      .text(width / 2, height - 28, 'Nephi Journey', {
        fontFamily: 'Verdana',
        fontSize: '14px',
        color: '#708090',
      })
      .setOrigin(0.5)
  }
}

class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene')
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x102130)

    this.add
      .text(width / 2, height / 2 - 100, 'Journey Complete', {
        fontFamily: 'Verdana',
        fontSize: '36px',
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(
        width / 2,
        height / 2 - 35,
        'Nephi and his family have reached the Promised Land.',
        {
          fontFamily: 'Verdana',
          fontSize: '20px',
          color: '#f7edd9',
          align: 'center',
          wordWrap: { width: Math.min(760, width - 80) },
        },
      )
      .setOrigin(0.5)

    const playAgain = this.add
      .text(width / 2, height / 2 + 70, 'Play Again', {
        fontFamily: 'Verdana',
        fontSize: '24px',
        color: '#111',
        backgroundColor: '#f2c14e',
        padding: { left: 22, right: 22, top: 12, bottom: 12 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    playAgain.on('pointerdown', () => {
      this.scene.start('StoryScene', { levelIndex: 0 })
    })
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0
  }

  create() {
    this.level = LEVELS[this.levelIndex]
    this.isShipLevel = this.levelIndex === 5
    this.waterlineY = 346
    this.invincibleUntil = 0
    // Level 3: the ladder Nephi is on, the ladders and roofs, and whether
    // he's on the street, a roof or a ladder (for the guards).
    this.climbing = null
    this.ladders = []
    this.roofs = null
    this.plane = 'ground'
    // Levels 4 and 5: Nephi's sword, and when he last swung it.
    this.sword = null
    // Level 5: the monkeys in the palm trees, and their coconuts.
    this.monkeys = []
    this.coconuts = null
    this.swingStartedAt = -Infinity
    this.levelFinished = false
    this.hearts = HEARTS
    // Since his last hit: until when he's knocked back, and until when he
    // can't be hurt again (see hurtNephi).
    this.staggerUntil = 0
    this.hurtUntil = 0
    this.gamePaused = false
    this.scrollsCollected = 0

    this.cameras.main.setBackgroundColor(this.level.theme.skyTop)
    this.physics.world.gravity.y = this.isShipLevel ? 0 : GRAVITY_Y
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.buildBackdrop()
    this.buildWorld()
    this.buildPlayer()
    this.buildEnemies()
    this.buildCoconuts()
    this.buildScrolls()
    this.buildGoal()
    this.buildHUD()
    this.setupTouch()
    this.setupInputs()
    this.applyCamera()
    // Phaser moves sprites by their physics after update(), so anything
    // placed to follow them is placed after that.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.afterPhysics, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.afterPhysics, this)
    })

    if (this.physics.world.debugGraphic) {
      this.physics.world.debugGraphic.setDepth(1000)
    }
  }

  buildBackdrop() {
    const { skyTop, skyBottom } = this.level.theme
    const top = Phaser.Display.Color.IntegerToColor(skyTop)
    const bottom = Phaser.Display.Color.IntegerToColor(skyBottom)

    const bg = this.add.graphics().setScrollFactor(0.2)
    for (let y = 0; y < WORLD_HEIGHT; y += 6) {
      const t = y / WORLD_HEIGHT
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        top,
        bottom,
        100,
        t * 100,
      )
      bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      bg.fillRect(0, y, WORLD_WIDTH, 6)
    }

    bg.fillStyle(0xffffff, 0.06)
    for (let i = 0; i < 18; i += 1) {
      const x = 180 + i * 260
      const y = 70 + (i % 3) * 24
      bg.fillCircle(x, y, 32 + (i % 4) * 8)
    }

    this.drawBackdropDecorations(bg)
  }

  drawBackdropDecorations(bg) {
    const { accent, groundTop } = this.level.theme
    switch (this.levelIndex) {
      case 0:
        this.drawDesertBackdrop(bg, groundTop, accent, false)
        break
      case 1:
        this.drawDesertBackdrop(bg, groundTop, accent, true)
        break
      case 2:
        this.drawCityBackdrop(bg, accent, groundTop)
        break
      case 3:
        this.drawReturnDesertBackdrop(bg, groundTop, accent)
        break
      case 4:
        this.drawCoastBackdrop(bg, accent, groundTop)
        break
      case 5:
        this.drawOceanBackdrop(bg, accent, groundTop)
        break
      default:
        this.drawDesertBackdrop(bg, groundTop, accent, false)
        break
    }
  }

  drawDesertBackdrop(bg, duneColor, accentColor, mirrored) {
    const dunes = mirrored
      ? [
          { x: 500, y: 412, width: 960, height: 180 },
          { x: 1680, y: 424, width: 1120, height: 200 },
          { x: 3180, y: 410, width: 1020, height: 176 },
          { x: 4380, y: 428, width: 880, height: 190 },
        ]
      : [
          { x: 620, y: 420, width: 1020, height: 190 },
          { x: 1880, y: 430, width: 1120, height: 210 },
          { x: 3320, y: 416, width: 980, height: 182 },
          { x: 4520, y: 424, width: 860, height: 176 },
        ]

    dunes.forEach((dune) => {
      bg.fillStyle(duneColor, 0.18)
      bg.fillEllipse(dune.x, dune.y, dune.width, dune.height)
    })

    const mountains = mirrored
      ? [620, 1820, 3100, 4260]
      : [820, 2140, 3500, 4660]
    mountains.forEach((x, index) => {
      this.drawMountain(
        bg,
        x,
        315 + (index % 2) * 24,
        420 + index * 10,
        150 + (index % 3) * 16,
        accentColor,
        0.16,
      )
    })

    this.drawTent(bg, mirrored ? 980 : 3840, 330, 120, 90, accentColor, 0.22)
    this.drawTent(bg, mirrored ? 3320 : 1260, 346, 100, 76, duneColor, 0.16)
    this.drawSun(bg, mirrored ? 4460 : 4300, 104, 72, accentColor, 0.22)
  }

  drawReturnDesertBackdrop(bg, duneColor, accentColor) {
    const dunes = [
      { x: 560, y: 416, width: 1040, height: 188 },
      { x: 1900, y: 428, width: 1160, height: 208 },
      { x: 3340, y: 412, width: 1080, height: 184 },
      { x: 4500, y: 424, width: 900, height: 180 },
    ]
    dunes.forEach((dune) => {
      bg.fillStyle(duneColor, 0.2)
      bg.fillEllipse(dune.x, dune.y, dune.width, dune.height)
    })

    this.drawMountain(bg, 980, 308, 460, 164, accentColor, 0.17)
    this.drawMountain(bg, 2480, 320, 520, 176, accentColor, 0.14)
    this.drawMountain(bg, 4040, 312, 500, 168, accentColor, 0.15)
    this.drawTent(bg, 820, 338, 124, 90, accentColor, 0.22)
    this.drawTent(bg, 2700, 348, 110, 82, accentColor, 0.18)
    this.drawTent(bg, 4020, 332, 124, 92, accentColor, 0.22)
    this.drawSun(bg, 430, 108, 64, accentColor, 0.18)
  }

  drawCityBackdrop(bg, accentColor, stoneColor) {
    // A spread of overlapping City.webp silhouettes reads as a continuous
    // skyline across the level, the same way the old hand-drawn blocks did.
    const skyline = [
      { x: 260, y: 210, width: 440, height: 214, alpha: 0.2 },
      { x: 760, y: 186, width: 480, height: 240, alpha: 0.24 },
      { x: 1340, y: 202, width: 450, height: 220, alpha: 0.18 },
      { x: 1900, y: 192, width: 470, height: 232, alpha: 0.22 },
      { x: 2480, y: 206, width: 440, height: 212, alpha: 0.16 },
      { x: 3040, y: 196, width: 470, height: 228, alpha: 0.2 },
    ]

    skyline.forEach((spot) => {
      this.add
        .image(spot.x, spot.y, 'city')
        .setOrigin(0.5, 0)
        .setDisplaySize(spot.width, spot.height)
        .setTint(stoneColor)
        .setAlpha(spot.alpha)
        .setScrollFactor(0.2)
    })

    this.drawWallBand(bg, 0x3b342f, 0.12, 250)
    this.drawBanner(bg, 920, 278, accentColor, 0.18)
    this.drawBanner(bg, 3220, 300, accentColor, 0.16)
  }

  drawCoastBackdrop(bg, accentColor, shorelineColor) {
    const waves = [
      { x: 640, y: 320, w: 840, h: 120 },
      { x: 1760, y: 332, w: 960, h: 128 },
      { x: 3040, y: 324, w: 980, h: 122 },
      { x: 4280, y: 330, w: 860, h: 120 },
    ]
    waves.forEach((wave) => {
      bg.fillStyle(shorelineColor, 0.16)
      bg.fillEllipse(wave.x, wave.y, wave.w, wave.h)
    })

    this.drawPalm(bg, 460, 356, accentColor, 0.18)
    this.drawPalm(bg, 1420, 362, accentColor, 0.14)
    this.drawPalm(bg, 3380, 350, accentColor, 0.18)
    this.drawPalm(bg, 4300, 360, accentColor, 0.16)
    this.drawCliff(bg, 740, 284, 240, 150, shorelineColor, 0.18)
    this.drawCliff(bg, 2500, 268, 280, 168, shorelineColor, 0.16)
    this.drawSun(bg, 4340, 96, 70, accentColor, 0.24)
  }

  drawOceanBackdrop(bg, accentColor, horizonColor) {
    this.drawWaveBand(bg, 460, 302, 0x2f6f9b, 0.12)
    this.drawWaveBand(bg, 1540, 318, 0x2f6f9b, 0.14)
    this.drawWaveBand(bg, 2720, 304, 0x2f6f9b, 0.12)
    this.drawWaveBand(bg, 3920, 314, 0x2f6f9b, 0.14)

    this.drawBoat(bg, 820, 312, 190, 96, horizonColor, 0.16)
    this.drawBoat(bg, 2440, 286, 210, 110, accentColor, 0.2)
    this.drawBoat(bg, 3900, 300, 220, 108, horizonColor, 0.18)
    this.drawIsland(bg, 1470, 260, 250, 80, accentColor, 0.14)
    this.drawIsland(bg, 3240, 244, 220, 72, accentColor, 0.12)
    this.drawSun(bg, 4380, 96, 72, accentColor, 0.22)
  }

  drawMountain(bg, x, baseY, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillTriangle(
      x - width / 2,
      baseY,
      x,
      baseY - height,
      x + width / 2,
      baseY,
    )
    bg.fillStyle(color, alpha * 0.55)
    bg.fillTriangle(
      x + width * 0.08,
      baseY,
      x + width * 0.5,
      baseY,
      x + width * 0.1,
      baseY - height * 0.78,
    )
  }

  drawDune(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillEllipse(x, y, width, height)
  }

  drawTent(bg, x, y, width, height, color, alpha) {
    // Matches the old triangle's bounding box exactly: left edge at x,
    // right edge at x + width, top at y, bottom at y + height.
    return this.add
      .image(x + width / 2, y, 'tent')
      .setOrigin(0.5, 0)
      .setDisplaySize(width, height)
      .setTint(color)
      .setAlpha(alpha)
      .setScrollFactor(0.2)
  }

  drawSun(bg, x, y, radius, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillCircle(x, y, radius)
  }

  drawTower(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillRect(x, y, width, height)
    bg.fillTriangle(x - 6, y + 4, x + width / 2, y - 42, x + width + 6, y + 4)
  }

  drawDome(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillRect(x, y + height * 0.35, width, height * 0.65)
    bg.fillCircle(x + width / 2, y + height * 0.35, width / 2)
  }

  drawWallBand(bg, color, alpha, topY) {
    bg.fillStyle(color, alpha)
    bg.fillRect(0, topY, WORLD_WIDTH, 22)
  }

  drawBanner(bg, x, y, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillRect(x, y, 18, 86)
    bg.fillTriangle(x + 18, y + 8, x + 58, y + 22, x + 18, y + 36)
  }

  drawPalm(bg, x, y, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillRect(x, y - 68, 10, 68)
    bg.fillTriangle(x + 5, y - 64, x - 36, y - 84, x + 12, y - 72)
    bg.fillTriangle(x + 5, y - 64, x + 40, y - 90, x + 18, y - 72)
    bg.fillTriangle(x + 5, y - 64, x - 18, y - 104, x + 12, y - 72)
    bg.fillTriangle(x + 5, y - 64, x + 8, y - 108, x + 16, y - 72)
  }

  drawCliff(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillTriangle(x, y + height, x + width / 2, y, x + width, y + height)
    bg.fillRect(x + width * 0.15, y + height * 0.5, width * 0.7, height * 0.5)
  }

  drawWaveBand(bg, x, y, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillEllipse(x, y, 460, 92)
    bg.fillEllipse(x + 260, y + 10, 420, 82)
  }

  drawBoat(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillTriangle(
      x,
      y + height,
      x + width,
      y + height,
      x + width * 0.72,
      y + height * 0.55,
    )
    bg.fillTriangle(
      x,
      y + height,
      x + width * 0.28,
      y + height * 0.55,
      x + width * 0.72,
      y + height * 0.55,
    )
    bg.fillRect(x + width * 0.46, y + 10, 8, height * 0.85)
    bg.fillTriangle(
      x + width * 0.5,
      y + 14,
      x + width * 0.86,
      y + height * 0.42,
      x + width * 0.5,
      y + height * 0.42,
    )
    bg.fillTriangle(
      x + width * 0.5,
      y + 14,
      x + width * 0.16,
      y + height * 0.42,
      x + width * 0.5,
      y + height * 0.42,
    )
  }

  drawIsland(bg, x, y, width, height, color, alpha) {
    bg.fillStyle(color, alpha)
    bg.fillEllipse(x, y + height, width, height * 0.7)
    bg.fillTriangle(
      x - width * 0.2,
      y + height,
      x + width / 2,
      y,
      x + width * 1.2,
      y + height,
    )
  }

  buildWorld() {
    const groundY = 470
    this.groundY = groundY
    const { groundTop } = this.level.theme
    const layout = LEVEL_LAYOUTS[this.levelIndex]

    if (this.isShipLevel) {
      this.buildWaterWorld()
      return
    }
    if (this.levelIndex === MONKEY_LEVEL) {
      this.buildPalms(layout)
    }

    const groundTiles = this.physics.add.staticGroup()
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      const tile = groundTiles.create(x + 32, groundY + 32, 'ground')
      tile.setScale(1, 1)
      tile.refreshBody()
    }
    this.groundTiles = groundTiles

    const ledges = this.physics.add.staticGroup()
    this.getExpandedPlatforms(layout.platforms).forEach((platform) => {
      const tiles = Math.max(1, Math.ceil(platform.width / 64))
      for (let i = 0; i < tiles; i += 1) {
        const tile = ledges.create(platform.x + i * 64, platform.y, 'platform')
        tile.refreshBody()
        // Shrink the collision box to match the painted bar at the top of the
        // 64x64 texture frame instead of the whole (mostly transparent) frame,
        // so the walkable surface lines up with what's actually drawn on screen.
        tile.body.setSize(64, PLATFORM_VISUAL_HEIGHT)
        tile.body.setOffset(0, 0)
      }
    })
    this.ledges = ledges
    if (this.levelIndex === 2) {
      this.buildStreet()
    }

    const levelOverlay = this.add.graphics().setAlpha(0.16)
    levelOverlay.fillStyle(groundTop, 1)
    levelOverlay.fillRect(0, groundY - 80, WORLD_WIDTH, 80)
  }

  // Level 5's palm grove (see groveLayout), drawn behind everyone, with a
  // monkey in the crown of one palm in ten.
  buildPalms(layout) {
    const palms = groveLayout(this.getExpandedPlatforms(layout.platforms))
    for (const { x, height, frame, flip } of palms) {
      this.add
        .image(x, this.groundY, PALM.sheet, frame)
        .setOrigin(0.5, 1)
        .setDisplaySize(palmWidth(height), height)
        .setFlipX(flip)
    }
    const now = this.game.loop.time
    for (const { x, height } of palms.filter((palm) => palm.monkey)) {
      const perch = this.groundY - Math.round(height * PALM.perch)
      const sprite = this.add
        .sprite(x, perch, MONKEY.sheet, MONKEY_FRAMES.sit)
        .setOrigin(0.5, 1)
        .setDisplaySize(...MONKEY.display)
      this.monkeys.push({
        sprite,
        // The throw he's partway through, if any: its poses and which he's at.
        throw: null,
        step: 0,
        stepEndsAt: 0,
        nextThrowAt: now + Phaser.Math.Between(...MONKEY_REST_MS),
      })
    }
  }

  // Level 3's buildings and ladders (see STREET), drawn behind everyone. Their
  // roofs hold Nephi up when he lands on them from above.
  buildStreet() {
    this.roofs = this.physics.add.staticGroup()
    streetLayout().forEach((building, index) => {
      const top = this.groundY - building.height
      this.placeBuilding(building, top, index)
      const roof = this.add
        .rectangle(
          building.x + building.width / 2,
          top + ROOF_THICKNESS / 2,
          building.width,
          ROOF_THICKNESS,
        )
        .setVisible(false)
      this.roofs.add(roof)
      Object.assign(roof.body.checkCollision, {
        down: false,
        left: false,
        right: false,
      })
      if (building.ladderX !== undefined) {
        this.ladders.push({ x: building.ladderX, top, bottom: this.groundY })
      }
    })
  }

  // Draws a building and its ladder once, into a picture of their own, and
  // shows that. Drawn as shapes, the street was thousands of them redrawn
  // every frame, which made phones stutter.
  placeBuilding(building, top, index) {
    const { x, width, ladderX } = building
    // Room for the parapet either side and a ladder's rails above the roof.
    const left = x - 4
    const above = top - 18
    const key = `street-building-${index}`
    if (!this.textures.exists(key)) {
      const art = this.make.graphics({}, false)
      art.translateCanvas(-left, -above)
      this.drawBuilding(art, building, top, index)
      if (ladderX !== undefined) {
        this.drawLadder(art, ladderX, top)
      }
      art.generateTexture(key, width + 8, this.groundY - above)
      art.destroy()
    }
    this.add.image(left, above, key).setOrigin(0, 0)
  }

  drawBuilding(g, { x, width, height, ladderX }, top, index) {
    const stone = BUILDING_STONES[index % BUILDING_STONES.length]
    const bottom = this.groundY
    // Walls, with one side in shadow and courses of stone.
    g.fillStyle(stone.wall, 1).fillRect(x, top, width, height)
    g.fillStyle(stone.shade, 1).fillRect(x, top, 8, height)
    g.lineStyle(1, stone.dark, 0.3)
    for (let y = top + 18; y < bottom; y += 18) {
      g.lineBetween(x, y + 0.5, x + width, y + 0.5)
    }
    // Rows of arched windows, clear of the ladder.
    const clearOfLadder = (from, to) =>
      ladderX === undefined || to < ladderX - 18 || from > ladderX + 18
    for (let y = top + 30; y + 26 < bottom - 64; y += 58) {
      for (let wx = x + 24; wx + 18 < x + width - 14; wx += 46) {
        if (!clearOfLadder(wx, wx + 18)) {
          continue
        }
        g.fillStyle(0x241d1a, 1).fillRect(wx, y + 8, 18, 18)
        g.fillCircle(wx + 9, y + 8, 9)
        g.fillStyle(stone.light, 1).fillRect(wx - 3, y + 26, 24, 4)
      }
    }
    // A door onto the street, away from the ladder, and an awning on some.
    const doorX =
      ladderX !== undefined && ladderX < x + width / 2 ? x + width - 58 : x + 30
    g.fillStyle(0x5a3a22, 1).fillRect(doorX, bottom - 40, 28, 40)
    g.fillCircle(doorX + 14, bottom - 40, 14)
    if (index % 3 === 1) {
      const awning = AWNINGS[index % AWNINGS.length]
      for (let i = 0; i < 5; i += 1) {
        g.fillStyle(i % 2 ? 0xf2e6c8 : awning, 1)
        g.fillRect(doorX - 10 + i * 10, bottom - 70, 10, 12)
      }
    }
    // A parapet along the roof, and an outline.
    g.fillStyle(stone.light, 1).fillRect(x - 4, top - 6, width + 8, 10)
    g.lineStyle(3, stone.dark, 1)
    g.strokeRect(x + 0.5, top - 5.5, width - 1, height + 5)
  }

  drawLadder(g, x, top) {
    const bottom = this.groundY
    const railTop = top - 18
    g.fillStyle(0x3d2614, 1)
    g.fillRect(x - 13, railTop, 6, bottom - railTop)
    g.fillRect(x + 7, railTop, 6, bottom - railTop)
    g.fillStyle(0x8a5a32, 1)
    for (let y = bottom - 10; y > railTop + 4; y -= 14) {
      g.fillRect(x - 11, y, 22, 4)
    }
  }

  getExpandedPlatforms(platforms) {
    const expanded = []

    platforms.forEach((platform, index) => {
      const worldX = platform.x * LEVEL_X_SCALE
      expanded.push({
        x: worldX,
        y: platform.y,
        width: platform.width,
      })

      const offsetDirection = index % 2 === 0 ? 1 : -1
      const offset = 360 + (index % 3) * 80
      const companionX = Phaser.Math.Clamp(
        worldX + offsetDirection * offset,
        96,
        WORLD_WIDTH - platform.width - 96,
      )
      const companionY = Phaser.Math.Clamp(
        platform.y - 24 + (index % 3) * 12,
        220,
        420,
      )
      expanded.push({
        x: companionX,
        y: companionY,
        width: platform.width,
      })
    })

    return expanded
  }

  buildWaterWorld() {
    const depth = WORLD_HEIGHT - this.waterlineY
    const water = this.add.graphics().setAlpha(0.95)
    water.fillStyle(0x144b73, 0.95)
    water.fillRect(0, this.waterlineY, WORLD_WIDTH, depth)

    // The surface, drawn in front of the sea creatures and the boat's hull
    // (depth 4) and see-through, so they look underwater.
    const surface = this.add.graphics().setDepth(4)
    surface.fillStyle(0x144b73, 0.4)
    surface.fillRect(0, this.waterlineY + 2, WORLD_WIDTH, depth)
    surface.lineStyle(3, 0x7fd5f1, 0.18)
    for (let x = 0; x < WORLD_WIDTH; x += 52) {
      surface.strokeEllipse(
        x + 26,
        this.waterlineY + 12 + (x % 104 === 0 ? 8 : 0),
        52,
        14,
      )
    }

    const foam = this.add.graphics().setAlpha(0.16).setDepth(4)
    foam.fillStyle(0xc9f2ff, 1)
    for (let x = 0; x < WORLD_WIDTH; x += 160) {
      foam.fillEllipse(x + 80, this.waterlineY + 20, 170, 20)
    }
  }

  // Dynamic Arcade bodies interpret setSize(w, h) in the sprite's original,
  // pre-scale texture space: the real on-screen box ends up being w*scaleX by
  // h*scaleY. Since setDisplaySize() changes that scale to whatever the source
  // image's native dimensions require, calling body.setSize(28, 48) after it
  // does NOT reliably produce a 28x48 box - the real size depends on the raw
  // pixel dimensions of the loaded artwork. This helper divides out the
  // current scale so the resulting body always matches the requested size in
  // actual display pixels, regardless of the source image's native size.
  setDisplayBodyBox(sprite, boxWidth, boxHeight) {
    const scaleX = sprite.scaleX || 1
    const scaleY = sprite.scaleY || 1
    sprite.body.setSize(boxWidth / scaleX, boxHeight / scaleY, true)
  }

  buildPlayer() {
    const playerY = this.isShipLevel
      ? this.waterlineY - BOAT_RIDE
      : this.groundY - 60
    if (SWORD_LEVELS.includes(this.levelIndex)) {
      // Made first, so it's drawn behind him and his fist covers the grip.
      this.sword = this.add
        .image(0, 0, 'sword')
        .setOrigin(0.5, SWORD_GRIP_Y)
        .setScale(1 / 3)
    }
    this.player = this.isShipLevel
      ? this.physics.add.sprite(90, playerY, 'ship')
      : this.physics.add.sprite(90, playerY, WALKERS.nephi.key, FRAME_STILL)
    if (!this.isShipLevel) {
      setAnimSize(this.player, WALKERS.nephi)
    }
    this.player.setCollideWorldBounds(true)
    if (this.isShipLevel) {
      this.player.setDisplaySize(...BOAT_DISPLAY)
      const [x, y, w, h] = BOAT_HULL
      const { scaleX, scaleY } = this.player
      this.player.body.setSize(w / scaleX, h / scaleY, false)
      this.player.body.setOffset(x / scaleX, y / scaleY)
      this.player.body.setAllowGravity(false)
      // update() places the boat itself each frame. If physics also moved
      // it (by how far its body moved since the last frame), the two would
      // overcorrect each other and the boat would shake.
      this.player.body.moves = false
      this.player.setBounce(0)
      this.player.setDragX(900)
    } else {
      this.setDisplayBodyBox(this.player, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT)
      this.player.setBounce(0.05)
      this.player.setDragX(1100)

      this.physics.add.collider(this.player, this.groundTiles)
      this.physics.add.collider(this.player, this.ledges)
      if (this.roofs) {
        // Not while he's climbing through one on a ladder.
        this.physics.add.collider(
          this.player,
          this.roofs,
          null,
          () => !this.climbing,
        )
      }
    }
  }

  buildEnemies() {
    this.enemies = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })
    this.enemyConfigs = []
    const layout = LEVEL_LAYOUTS[this.levelIndex]
    const platformAnchors = this.getExpandedPlatforms(layout.platforms).map(
      (platform) => ({
        left: platform.x,
        right: platform.x + platform.width,
        // True visual top surface of the platform (see PLATFORM_FRAME_HALF note above).
        top: platform.y - PLATFORM_FRAME_HALF,
      }),
    )

    layout.enemies.forEach((x, index) => {
      const worldX = x * LEVEL_X_SCALE
      if (this.isShipLevel) {
        this.addSeaCreature(worldX, index % 3 === 1 ? 'whale' : 'shark')
        return
      }
      const supportPlatform = platformAnchors.find(
        (anchor) => worldX >= anchor.left && worldX <= anchor.right,
      )
      const texture = this.chooseEnemyTexture(worldX)
      const isGuard = texture === 'guard'
      const displayHeight = isGuard
        ? GUARD_DISPLAY_HEIGHT
        : ENEMY_DISPLAY_HEIGHT
      const bodyHeight = isGuard ? GUARD_BODY_HEIGHT : ENEMY_BODY_HEIGHT
      const y = this.getLandEnemyY(worldX, platformAnchors, displayHeight)
      const anim = ENEMY_ANIMS[texture]
      const enemy = this.enemies.create(worldX, y, anim.key, FRAME_STILL)
      setAnimSize(enemy, anim)
      this.setDisplayBodyBox(enemy, ENEMY_BODY_WIDTH, bodyHeight)
      const speedMultiplier =
        1 +
        Phaser.Math.FloatBetween(-ENEMY_SPEED_VARIATION, ENEMY_SPEED_VARIATION)
      enemy.setData('speed', ENEMY_SPEED * speedMultiplier)
      // Enemies never stop moving. Each keeps its own pace, from a random
      // point in the loop, so they don't all move in lockstep.
      enemy.anims.play({
        key: anim.key,
        startFrame: Phaser.Math.Between(0, ANIM_STEPS - 1),
        timeScale: speedMultiplier,
      })
      if (isGuard) {
        enemy.setData({ hunter: 'guard', chasing: false })
      }
      if (supportPlatform) {
        const enemyPadding = 20
        enemy.setData('minX', supportPlatform.left + enemyPadding)
        enemy.setData('maxX', supportPlatform.right - enemyPadding)
      } else {
        enemy.setData('minX', worldX - LAND_ENEMY_RANGE * LEVEL_X_SCALE)
        enemy.setData('maxX', worldX + LAND_ENEMY_RANGE * LEVEL_X_SCALE)
      }
      enemy.setData('direction', Math.random() < 0.5 ? -1 : 1)
      const turnRange = this.getEnemyTurnDelayRange()
      enemy.setData(
        'nextTurnAt',
        this.time.now + Phaser.Math.Between(turnRange.min, turnRange.max),
      )
      this.enemyConfigs.push(enemy)
    })

    if (LION_LEVELS.includes(this.levelIndex)) {
      LION_SPOTS.forEach((spot) => this.addLion(WORLD_WIDTH * spot))
    }

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyHit,
      null,
      this,
    )
  }

  // Level 5's coconuts: they land on the ground and platforms, and hit Nephi
  // only while flying at him.
  buildCoconuts() {
    if (!this.monkeys.length) {
      return
    }
    this.coconuts = this.physics.add.group()
    for (const surface of [this.groundTiles, this.ledges]) {
      this.physics.add.collider(this.coconuts, surface, (coconut) =>
        this.landCoconut(coconut),
      )
    }
    this.physics.add.overlap(
      this.player,
      this.coconuts,
      (player, coconut) => this.hitByCoconut(coconut),
      (player, coconut) => coconut.getData('live'),
    )
  }

  // A lion on the ground, patrolling and hunting like a guard.
  addLion(x) {
    const y = this.groundY - LION.display[1] / 2
    const lion = this.enemies.create(x, y, LION.sheet, LION_FRAMES.stand)
    lion.setDisplaySize(...LION.display)
    const [width, height] = LION_BODY
    const { scaleX, scaleY } = lion
    lion.body.setSize(width / scaleX, height / scaleY, false)
    lion.body.setOffset(
      (LION.display[0] - width) / 2 / scaleX,
      LION_BODY_TOP / scaleY,
    )
    const pace =
      1 +
      Phaser.Math.FloatBetween(-ENEMY_SPEED_VARIATION, ENEMY_SPEED_VARIATION)
    lion.anims.play({
      key: LION.walk,
      startFrame: Phaser.Math.Between(0, LION_FRAMES.walk.length - 1),
      timeScale: pace,
    })
    const turnRange = this.getEnemyTurnDelayRange()
    const now = this.game.loop.time
    lion.setData({
      hunter: 'lion',
      chasing: false,
      pace,
      speed: ENEMY_SPEED * pace,
      direction: Math.random() < 0.5 ? -1 : 1,
      minX: x - HUNTER_PATROL_RANGE,
      maxX: x + HUNTER_PATROL_RANGE,
      nextTurnAt: now + Phaser.Math.Between(turnRange.min, turnRange.max),
      restUntil: 0,
      restAt: now + Phaser.Math.Between(...LION_REST_EVERY_MS),
    })
    this.enemyConfigs.push(lion)
  }

  // A shark or whale for level 6, cruising at its own depth and pace.
  addSeaCreature(x, kind) {
    const anim = CRAWLERS[kind]
    const [shallowest, deepest] = SEA_CREATURES[kind].depth
    const cruiseY = this.waterlineY + Phaser.Math.Between(shallowest, deepest)
    const enemy = this.enemies.create(x, cruiseY, anim.key, FRAME_STILL)
    setAnimSize(enemy, anim)
    const pace =
      1 + Phaser.Math.FloatBetween(-SEA_PACE_VARIATION, SEA_PACE_VARIATION)
    enemy.anims.play({
      key: anim.key,
      startFrame: Phaser.Math.Between(0, ANIM_STEPS - 1),
      timeScale: pace,
    })
    enemy.setData({
      kind,
      pace,
      cruiseY,
      minX: x - SEA_RANGE,
      maxX: x + SEA_RANGE,
      mode: 'cruise',
      // A little longer at first, to give the boat a moment. (The game
      // loop's clock is the one update() gets; at the start of a level the
      // scene's own clock can still be showing an old time.)
      nextRiseAt:
        this.game.loop.time + SEA_WAIT[0] + Phaser.Math.Between(...SEA_WAIT),
    })
    this.faceSeaCreature(enemy, Math.random() < 0.5 ? -1 : 1)
    this.enemyConfigs.push(enemy)
  }

  // Turns a sea creature to swim left (-1) or right (1), and moves its
  // hitbox to match: Arcade bodies don't flip with their sprites.
  faceSeaCreature(enemy, direction) {
    enemy.setData('direction', direction)
    enemy.flipX = direction < 0
    const [x, y, w, h] = SEA_CREATURES[enemy.getData('kind')].hitbox
    const left = ANIM_MARGIN + x
    const offsetX = enemy.flipX ? enemy.displayWidth - left - w : left
    const { scaleX, scaleY } = enemy
    enemy.body.setSize(w / scaleX, h / scaleY, false)
    enemy.body.setOffset(offsetX / scaleX, y / scaleY)
  }

  // One step of a sea creature's swim: cruising, rising at the boat, or
  // diving back down afterwards.
  swim(enemy, time) {
    const creature = SEA_CREATURES[enemy.getData('kind')]
    const pace = enemy.getData('pace')
    const speed = creature.speed * pace
    const rise = creature.rise * pace
    let direction = enemy.getData('direction')
    let vx = direction * speed
    let vy = 0

    switch (enemy.getData('mode')) {
      case 'cruise': {
        const turn =
          enemy.x <= enemy.getData('minX')
            ? 1
            : enemy.x >= enemy.getData('maxX')
              ? -1
              : direction
        if (turn !== direction) {
          this.faceSeaCreature(enemy, turn)
          direction = turn
          vx = direction * speed
        }
        // Ease back to cruising depth, as after a dive.
        vy = Phaser.Math.Clamp(
          (enemy.getData('cruiseY') - enemy.y) * 3,
          -60,
          60,
        )
        if (time >= enemy.getData('nextRiseAt')) {
          const across = this.player.x - enemy.x
          if (Math.abs(across) <= SEA_REACH) {
            enemy.setData({
              mode: 'rise',
              targetX: this.player.x,
              chaseUntil: time + SEA_CHASE_MS,
            })
            this.faceSeaCreature(enemy, Math.sign(across) || direction)
          } else {
            enemy.setData('nextRiseAt', time + 400)
          }
        }
        break
      }
      case 'rise': {
        const dx = enemy.getData('targetX') - enemy.x
        const dy = this.waterlineY - SEA_BREACH - enemy.y
        if (dy >= 0) {
          enemy.setData('mode', 'dive')
        } else if (Math.abs(dx) > SEA_STRIKE) {
          // Dash along underneath first, following the boat...
          if (time < enemy.getData('chaseUntil')) {
            enemy.setData('targetX', this.player.x)
          }
          if (Math.sign(dx) !== enemy.getData('direction')) {
            this.faceSeaCreature(enemy, Math.sign(dx))
          }
          vx = Math.sign(dx) * rise
          vy = Phaser.Math.Clamp(
            (enemy.getData('cruiseY') - enemy.y) * 3,
            -60,
            60,
          )
        } else {
          // ...then surge up at the spot it's reached.
          const distance = Math.hypot(dx, dy)
          vx = (dx / distance) * rise
          vy = (dy / distance) * rise
        }
        break
      }
      case 'dive': {
        vy = rise * 0.7
        if (enemy.y >= enemy.getData('cruiseY')) {
          enemy.setData({
            mode: 'cruise',
            nextRiseAt: time + Phaser.Math.Between(...SEA_WAIT),
          })
        }
        break
      }
    }

    enemy.body.setVelocity(vx, vy)
    // Nose up when rising, down when diving.
    const tilt = Phaser.Math.RadToDeg(Math.atan2(vy, Math.abs(vx) + 1))
    const angle = Phaser.Math.Clamp(tilt, -40, 40) * (enemy.flipX ? -1 : 1)
    enemy.angle += (angle - enemy.angle) * 0.15
  }

  getLandEnemyY(x, platformAnchors, displayHeight = ENEMY_DISPLAY_HEIGHT) {
    // Position the enemy's center so its feet (bottom of its display box)
    // land exactly on the surface, whether that's a platform's visual top
    // edge or the ground line. displayHeight is passed in per-enemy since
    // guards are taller than the other enemies (see GUARD_DISPLAY_HEIGHT).
    const platform = platformAnchors.find(
      (anchor) => x >= anchor.left && x <= anchor.right,
    )
    const surfaceY = platform ? platform.top : this.groundY
    return surfaceY - displayHeight / 2
  }

  buildScrolls() {
    this.scrolls = this.physics.add.staticGroup()
    const positions = [WORLD_WIDTH / 4, WORLD_WIDTH / 2, (WORLD_WIDTH * 3) / 4]
    const messages =
      LEVEL_SCROLL_MESSAGES[this.levelIndex] || LEVEL_SCROLL_MESSAGES[0]
    this.totalScrolls = positions.length

    positions.forEach((x, index) => {
      const scrollY = this.isShipLevel
        ? this.waterlineY - 26
        : this.groundY - 90 - index * 16
      const scroll = this.scrolls.create(x, scrollY, 'scroll')
      scroll.setDisplaySize(34, 40)
      scroll.refreshBody()
      scroll.setData(
        'popupText',
        messages[index] || 'A treasured scroll has been collected.',
      )
    })

    this.physics.add.overlap(
      this.player,
      this.scrolls,
      this.collectScroll,
      null,
      this,
    )
  }

  buildGoal() {
    let goalY = this.isShipLevel ? this.waterlineY - 46 : this.groundY - 58
    let labelOffsetY = -70
    const goalTextureKey = this.getGoalTextureKey()
    this.goal = this.physics.add.staticSprite(
      WORLD_WIDTH - 92,
      goalY,
      goalTextureKey,
    )
    if (goalTextureKey === 'tent') {
      this.goal.setDisplaySize(90, 60)
    } else if (goalTextureKey === 'city') {
      this.goal.setDisplaySize(150, 105)
    } else if (goalTextureKey === 'laban') {
      // Fix the width to match 2.25x the guard sprite's height (3x, then
      // scaled down another 25%), and derive the display height from
      // Laban.webp's own native aspect ratio instead of a second hardcoded
      // number - otherwise the art gets squished/stretched to whatever
      // arbitrary box we picked.
      const targetWidth = GUARD_DISPLAY_HEIGHT * 3 * 0.75
      const aspectRatio = this.goal.height / this.goal.width
      const targetHeight = targetWidth * aspectRatio
      this.goal.setDisplaySize(targetWidth, targetHeight)
      // Put Laban's own vertical midpoint on the same plane Nephi stands
      // on, rather than aligning his feet to it like the other, smaller
      // goal icons do.
      goalY = this.groundY
      this.goal.setY(goalY)
      // The fixed -70 label offset was tuned for the old, much smaller
      // icons; scale it off Laban's actual height so the label still
      // sits just above his head instead of over his torso.
      labelOffsetY = -(targetHeight / 2 + 20)
    } else {
      this.goal.setScale(this.levelIndex === 2 ? 1.18 : 1.1)
    }
    this.goal.refreshBody()
    this.goal.setDepth(5)
    this.goalLabel = this.add
      .text(WORLD_WIDTH - 120, goalY + labelOffsetY, this.getGoalLabel(), {
        fontFamily: 'Verdana',
        fontSize: '14px',
        color: '#f7edd9',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6)
    this.physics.add.overlap(
      this.player,
      this.goal,
      this.handleGoalReached,
      null,
      this,
    )
  }

  getGoalTextureKey() {
    switch (this.levelIndex) {
      case 0:
      case 3:
        return 'tent'
      case 1:
        // End of Level 2 ("Back to Jerusalem") - reusing the same 'city'
        // texture already loaded for the Level 3 skyline backdrop.
        return 'city'
      case 2:
        // End of Level 3 ("The Streets of Jerusalem") - confronting Laban.
        return 'laban'
      case 4:
        return 'goal-shore'
      case 5:
        return 'goal-boat'
      default:
        return 'goal'
    }
  }

  getGoalLabel() {
    switch (this.levelIndex) {
      case 0:
        return 'Reach the tent'
      case 1:
        return 'Reach Jerusalem'
      case 2:
        return 'Find the book'
      case 3:
        return 'Return to the family'
      case 4:
        return 'Reach the coast'
      case 5:
        return 'Reach the promised land'
      default:
        return 'Goal'
    }
  }

  buildHUD() {
    this.levelLabel = this.add
      .text(18, 16, `${this.level.name}: ${this.level.title}`, {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)

    // Nephi's hearts (see HEARTS), on a panel like the labels'.
    const heartSize = HEART_ART.length * HEART_PIXEL
    const heartGap = 6
    const padding = 6
    this.add
      .rectangle(
        18,
        58,
        HEARTS * (heartSize + heartGap) - heartGap + padding * 2,
        heartSize + padding * 2,
        0x000000,
        0.4,
      )
      .setOrigin(0)
      .setScrollFactor(0)
    this.heartIcons = Array.from({ length: HEARTS }, (_, index) =>
      this.add
        .image(
          18 + padding + index * (heartSize + heartGap) + heartSize / 2,
          58 + padding + heartSize / 2,
          'heart',
        )
        .setScrollFactor(0),
    )

    this.statusText = this.add
      .text(18, 104, '', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#f2c14e',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)
      .setVisible(false)

    this.invincibleText = this.add
      .text(18, 142, '', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#5ad1a5',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)
      .setVisible(false)

    this.scrollCountText = this.add
      .text(
        this.scale.width - 18,
        16,
        `Scrolls: ${this.scrollsCollected}/${this.totalScrolls || 2}`,
        {
          fontFamily: 'Verdana',
          fontSize: '18px',
          color: '#f7edd9',
          fontStyle: 'bold',
          backgroundColor: 'rgba(0,0,0,0.4)',
          padding: { left: 10, right: 10, top: 6, bottom: 6 },
        },
      )
      .setOrigin(1, 0)
      .setScrollFactor(0)

    this.scrollPopupBg = this.add
      .rectangle(
        this.scale.width / 2,
        150,
        SCROLL_POPUP_WIDTH,
        92,
        0x101820,
        0.92,
      )
      .setStrokeStyle(3, 0xf2c14e, 1)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(50)

    this.scrollPopupText = this.add
      .text(this.scale.width / 2, 150, '', {
        fontFamily: 'Verdana',
        fontSize: `${SCROLL_POPUP_BASE_FONT}px`,
        color: '#f7edd9',
        align: 'center',
        wordWrap: { width: SCROLL_POPUP_WRAP_WIDTH },
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(51)

    this.scrollPopupTitle = this.add
      .text(this.scale.width / 2, 120, '', {
        fontFamily: 'Verdana',
        fontSize: '14px',
        color: '#f2c14e',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(51)

    this.scrollPopupButton = this.add
      .text(this.scale.width / 2, 150, 'Proceed', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#111',
        backgroundColor: '#f2c14e',
        padding: { left: 20, right: 20, top: 8, bottom: 8 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(51)
      .setInteractive({ useHandCursor: true })
  }

  // Touch controls: slide a finger to walk, tap or flick up to jump (see
  // touchControls.ts). They listen to the box the game sits in, not just the
  // canvas, so on a phone held upright the space below the game works too
  // and a thumb needn't cover the action.
  setupTouch() {
    this.touch = new SlideControls()
    const box = this.game.canvas.parentElement
    const touchOnly = (handle) => (event) => {
      if (event.pointerType !== 'mouse') {
        handle(event)
      }
    }
    const listeners = {
      // A finger's events keep coming here even if it slides out of the
      // box, as touches stay with where they started until they lift.
      pointerdown: touchOnly(({ pointerId, clientX, clientY, timeStamp }) => {
        const paused = this.gamePaused || this.levelFinished
        this.touch.down(pointerId, clientX, clientY, timeStamp, paused)
      }),
      pointermove: touchOnly(({ pointerId, clientX, clientY, timeStamp }) =>
        this.touch.move(pointerId, clientX, clientY, timeStamp),
      ),
      pointerup: touchOnly(({ pointerId, timeStamp }) =>
        this.touch.up(pointerId, timeStamp),
      ),
      pointercancel: touchOnly(({ pointerId }) => this.touch.cancel(pointerId)),
    }
    const removeListeners = () => {
      for (const [type, listener] of Object.entries(listeners)) {
        box.removeEventListener(type, listener)
      }
      this.events.off('shutdown', removeListeners)
      this.events.off('destroy', removeListeners)
    }
    for (const [type, listener] of Object.entries(listeners)) {
      box.addEventListener(type, listener)
    }
    this.events.on('shutdown', removeListeners)
    this.events.on('destroy', removeListeners)
  }

  setupInputs() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    )
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
    this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)
  }

  chooseEnemyTexture(x) {
    // Level 3 ("The Streets of Jerusalem") is patrolled by city guards
    // rather than the desert wildlife used everywhere else.
    if (this.levelIndex === 2) {
      return 'guard'
    }
    return Math.floor(x / ENEMY_SPACING) % 2 === 0 ? 'snake' : 'scorpion'
  }

  getEnemyTurnDelayRange() {
    switch (this.levelIndex) {
      case 0:
      case 1:
        return { min: 500, max: 1700 }
      case 2:
        return { min: 350, max: 1100 }
      case 3:
        return { min: 450, max: 1400 }
      case 4:
        return { min: 500, max: 1500 }
      default:
        return { min: 700, max: 2200 }
    }
  }

  getEnemyPatrolJitterChance() {
    switch (this.levelIndex) {
      case 0:
      case 1:
        return 0.2
      case 2:
        return 0.32
      case 3:
        return 0.24
      case 4:
        return 0.2
      default:
        return 0
    }
  }

  update(time) {
    if (!this.player) {
      return
    }
    if (this.levelFinished || this.gamePaused) {
      if (this.climbing) {
        this.animateClimb(false)
      } else {
        this.animateNephi(false)
      }
      return
    }

    const walk = this.touch.direction
    const leftPressed = this.cursors.left.isDown || this.keyA.isDown || walk < 0
    const rightPressed =
      this.cursors.right.isDown || this.keyD.isDown || walk > 0
    const upHeld =
      this.cursors.up.isDown || this.keyW.isDown || this.touch.vertical < 0
    const downHeld =
      this.cursors.down.isDown || this.keyS.isDown || this.touch.vertical > 0
    const upTapped =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW)
    const spaceTapped = Phaser.Input.Keyboard.JustDown(this.keySpace)
    const now = performance.now()

    if (this.isShipLevel) {
      let shipMove = 0
      if (leftPressed && !rightPressed) {
        shipMove = -PLAYER_SPEED
        this.player.flipX = true
      } else if (rightPressed && !leftPressed) {
        shipMove = PLAYER_SPEED
        this.player.flipX = false
      }

      this.player.x = Phaser.Math.Clamp(
        this.player.x + shipMove * (this.game.loop.delta / 1000),
        BOAT_DISPLAY[0] / 2,
        WORLD_WIDTH - BOAT_DISPLAY[0] / 2,
      )
      const bob = Math.sin(time / 180) * 2.5
      const tilt =
        shipMove === 0 ? Math.sin(time / 280) * 1.2 : shipMove > 0 ? 1.8 : -1.8
      this.player.y = this.waterlineY - BOAT_RIDE + bob
      this.player.angle = tilt
      this.player.body.updateFromGameObject()
    } else {
      const onGround =
        this.player.body.blocked.down || this.player.body.touching.down
      // Up at a ladder climbs it; down on a roof at the top climbs down.
      const ladder = this.ladderAt()
      if (ladder && !this.climbing) {
        const feet = this.player.body.bottom
        if (upHeld && feet > ladder.top + 2) {
          this.grabLadder(ladder)
        } else if (downHeld && onGround && feet <= ladder.top + 4) {
          this.grabLadder(ladder)
        }
      }

      if (this.climbing) {
        // A tap lets go; a flick up is just climbing.
        const letGo =
          spaceTapped || this.touch.wantsJump(now, { flicks: false })
        this.climb(upHeld, downHeld, letGo)
      } else {
        if (time < this.staggerUntil) {
          // Knocked back by a hit (see hurtNephi): no walking yet.
        } else if (leftPressed && !rightPressed) {
          this.player.setVelocityX(-PLAYER_SPEED)
          this.player.flipX = true
        } else if (rightPressed && !leftPressed) {
          this.player.setVelocityX(PLAYER_SPEED)
          this.player.flipX = false
        } else {
          this.player.setVelocityX(0)
        }

        const jumpPressed =
          spaceTapped || (upTapped && !ladder) || this.touch.wantsJump(now)
        if (jumpPressed && onGround) {
          this.player.setVelocityY(-PLAYER_JUMP)
          this.touch.clearJump()
        }

        this.animateNephi(leftPressed !== rightPressed)
      }
      this.updatePlane(onGround)
      if (this.sword) {
        const swing =
          Phaser.Input.Keyboard.JustDown(this.keyX) ||
          Phaser.Input.Keyboard.JustDown(this.keyJ) ||
          this.touch.wantsSwing(now)
        if (swing && time - this.swingStartedAt >= this.swingLength()) {
          this.swingStartedAt = time
          this.swooshDrawn = false
          this.touch.clearSwing()
        }
      }
    }

    this.updateEnemies(time)
    this.updateMonkeys(time)
    this.updateInvincibility(time)
  }

  // After physics has moved everything for this frame: the view, and what
  // follows Nephi or an enemy. Placed during update(), they'd be a frame
  // behind, by however far physics then moved (it steps 60 times a second,
  // whatever the screen's rate), and Nephi would jitter as the view scrolled.
  afterPhysics(time) {
    if (!this.player || this.levelFinished || this.gamePaused) {
      return
    }
    if (this.sword) {
      this.updateSword(time)
    }
    this.coconuts?.getChildren().forEach((coconut) => this.batCoconut(coconut))
    this.enemies.children.iterate((enemy) => {
      if (enemy?.active) {
        this.followAlert(enemy)
      }
    })
    this.applyCamera()
  }

  // The ladder Nephi can climb, if any: close enough across, and between its
  // foot and its top (as when standing on the roof beside it).
  ladderAt() {
    const { x, body } = this.player
    return this.ladders.find(
      (ladder) =>
        Math.abs(x - ladder.x) <= LADDER_REACH &&
        body.bottom >= ladder.top - 2 &&
        body.top <= ladder.bottom,
    )
  }

  grabLadder(ladder) {
    this.climbing = ladder
    this.player.body.setAllowGravity(false)
    this.player.body.reset(ladder.x, this.player.y)
    this.player.flipX = false
    this.touch.clearJump()
  }

  letGoOfLadder() {
    this.climbing = null
    this.player.body.setAllowGravity(true)
  }

  // A step on a ladder: Nephi climbs while up or down is held and holds on
  // otherwise, stepping off onto the roof at the top or the street at the
  // bottom. Jumping lets go.
  climb(up, down, jump) {
    const ladder = this.climbing
    const { body } = this.player
    if (jump) {
      this.letGoOfLadder()
      this.player.setVelocityY(-PLAYER_JUMP * 0.6)
      this.touch.clearJump()
      return
    }
    const vy = up && !down ? -CLIMB_SPEED : down && !up ? CLIMB_SPEED : 0
    this.player.setVelocity(0, vy)
    if (vy < 0 && body.bottom <= ladder.top) {
      // Feet level with the roof: step onto it.
      this.letGoOfLadder()
      this.player.setVelocityY(0)
    } else if (vy > 0 && body.bottom >= ladder.bottom) {
      this.letGoOfLadder()
    } else {
      this.animateClimb(vy !== 0)
    }
  }

  animateClimb(moving) {
    if (moving) {
      this.player.anims.play(CLIMB_KEY, true)
      return
    }
    this.player.anims.stop()
    this.player.setTexture(CLIMB_KEY, CLIMB_STILL)
  }

  // How long a swing takes, including a moment's rest after.
  swingLength() {
    return SWORD_SWING.at(-1).at + SWORD_REST_MS
  }

  // Where a swing is at, `t` milliseconds in: Nephi's pose (null: his usual
  // frame) and the sword's angle, eased between keyframes. Null once it's over.
  swingAt(t) {
    const next = SWORD_SWING.findIndex((key) => key.at > t)
    if (t < 0 || next < 1) {
      return null
    }
    const from = SWORD_SWING[next - 1]
    const to = SWORD_SWING[next]
    const eased = Phaser.Math.Easing.Sine.InOut(
      (t - from.at) / (to.at - from.at),
    )
    return {
      pose: from.pose,
      angle: from.angle + (to.angle - from.angle) * eased,
    }
  }

  // Nephi's pose in a frame of his walk sheet: standing, a step of his walk,
  // or a swing pose after those.
  nephiPose(frame) {
    const nephi = WALKERS.nephi
    if (frame === FRAME_STILL) {
      return stillPose(nephi)
    }
    if (frame <= ANIM_STEPS) {
      return walkPose(nephi, frame - 1)
    }
    return SWORD_POSE_LIST[frame - 1 - ANIM_STEPS]
  }

  // Where Nephi's forward fist is, relative to his middle, in the frame he's
  // showing: it moves as he walks and swings. In pixels on screen, for him
  // facing right.
  swordGrip() {
    const nephi = WALKERS.nephi
    const art = this.textures.get(nephi.art).getSourceImage()
    const [x, y, w, h] = nephi.hands[0].box
    const [width, height] = nephi.display
    let gripX = ((x + w / 2) * width) / art.width - width / 2
    let gripY = ((y + h / 2) * height) / art.height - height / 2
    if (this.player.texture.key === nephi.key) {
      const pose = this.nephiPose(this.player.frame.name)
      gripX += pose.lean + pose.hands[0][0]
      gripY += pose.body + pose.hands[0][1]
    }
    return [gripX, gripY]
  }

  // Keeps the sword in Nephi's fist: held up, or following a swing through
  // its poses (see SWORD_SWING), when any enemy the blade touches is killed.
  updateSword(time) {
    const t = time - this.swingStartedAt
    const swing = this.swingAt(t)
    if (swing?.pose) {
      this.player.anims.stop()
      const frame = 1 + ANIM_STEPS + SWORD_POSE_NAMES.indexOf(swing.pose)
      this.player.setTexture(WALKERS.nephi.key, frame)
    }
    const facing = this.player.flipX ? -1 : 1
    const [gripX, gripY] = this.swordGrip()
    // Across, from where he's drawn: at a whole pixel (see applyCamera).
    const x = Math.round(this.player.x) + gripX * facing
    const y = this.player.y + gripY
    const angle = swing?.angle ?? SWORD_CARRY_ANGLE
    this.sword
      .setPosition(x, y)
      .setAngle(angle * facing)
      .setFlipX(facing < 0)
      // Carried, it's behind him, under his fingers; swinging, in front, so
      // the blade shows as it passes his head and body.
      .setDepth(swing ? 1 : 0)
    const [strikeFrom, strikeTo] = SWORD_STRIKE_MS
    if (t >= strikeFrom && t < strikeTo) {
      if (!this.swooshDrawn) {
        this.swooshDrawn = true
        this.drawSwoosh(x, y, facing)
      }
      this.strikeWithSword(x, y, angle, facing)
    }
  }

  // Kills any enemy touching the blade, held at `angle` from the grip at
  // (x, y).
  strikeWithSword(x, y, angle, facing) {
    const radians = Phaser.Math.DegToRad(angle)
    const points = [0.35, 0.65, 1].map((along) => [
      x + facing * Math.sin(radians) * SWORD_BLADE * along,
      y - Math.cos(radians) * SWORD_BLADE * along,
    ])
    this.enemies.children.iterate((enemy) => {
      if (
        enemy?.active &&
        points.some(([px, py]) => enemy.body.hitTest(px, py))
      ) {
        this.killEnemy(enemy)
      }
    })
  }

  // A streak through the air where the sword strikes, around the grip at
  // (x, y).
  drawSwoosh(x, y, facing) {
    // Angles from pointing right, clockwise, as Phaser draws arcs.
    const from = SWORD_SWING[1].angle + 20 - 90
    const to = SWORD_SWING[3].angle - 90
    const toRadians = (degrees) =>
      Phaser.Math.DegToRad(facing > 0 ? degrees : 180 - degrees)
    const swoosh = this.add.graphics().setDepth(4)
    swoosh.lineStyle(4, 0xffffff, 0.7)
    swoosh.beginPath()
    swoosh.arc(
      x,
      y,
      SWORD_BLADE * 0.9,
      toRadians(from),
      toRadians(to),
      facing < 0,
    )
    swoosh.strokePath()
    this.tweens.add({
      targets: swoosh,
      alpha: 0,
      duration: 200,
      onComplete: () => swoosh.destroy(),
    })
  }

  // A kill by sword: the enemy vanishes in a burst. A lion lies down.
  killEnemy(enemy) {
    if (enemy.getData('hunter') === 'lion') {
      this.hitLion(enemy, this.player.flipX ? -1 : 1)
      return
    }
    enemy.disableBody(true, true)
    enemy.getData('alert')?.destroy()
    this.burst(enemy.x, enemy.y, 10, 3, 260)
  }

  // A blow to a lion, by sword or stomp, from Nephi's side: `away` is the
  // way it knocks him (1 right, -1 left). The first knocks him flying and
  // dazes him; the second beats him.
  hitLion(lion, away) {
    const time = this.game.loop.time
    if (time < lion.getData('knockedUntil')) {
      // Still flying from the last blow (one swing touches him for a while).
      return
    }
    if (lion.getData('wounded')) {
      this.layLionDown(lion)
      return
    }
    lion.getData('alert')?.destroy()
    const halfWidth = LION.display[0] / 2
    const x = Phaser.Math.Clamp(
      lion.x + away * LION_KNOCK_DISTANCE,
      halfWidth,
      WORLD_WIDTH - halfWidth,
    )
    // Dazed, facing Nephi, and hunting afresh from where he lands.
    lion.setData({
      wounded: true,
      chasing: false,
      restUntil: 0,
      knockedUntil: time + LION_KNOCK_MS,
      dazedUntil: time + LION_KNOCK_MS + LION_DAZE_MS,
      direction: -away,
      minX: x - HUNTER_PATROL_RANGE,
      maxX: x + HUNTER_PATROL_RANGE,
    })
    lion.flipX = away > 0
    lion.anims.stop()
    // Yelping as he flies.
    lion.setFrame(LION_FRAMES.roar)
    lion.setTintFill(0xffffff)
    this.time.delayedCall(90, () => lion.clearTint())
    // Moved by the tweens below, not by physics, until he lands.
    lion.body.setVelocityX(0)
    lion.body.moves = false
    this.tweens.add({
      targets: lion,
      x,
      duration: LION_KNOCK_MS,
      ease: 'Quad.Out',
      onComplete: () => {
        lion.body.moves = true
        if (lion.active) {
          lion.setFrame(LION_FRAMES.stand)
        }
      },
    })
    this.tweens.add({
      targets: lion,
      y: lion.y - LION_KNOCK_HOP,
      duration: LION_KNOCK_MS / 2,
      ease: 'Sine.Out',
      yoyo: true,
    })
    this.burst(lion.x, lion.y, 8, 2.5, 220)
  }

  // A beaten lion (by sword, or stomped on) lies down and fades away.
  layLionDown(lion) {
    lion.getData('alert')?.destroy()
    // Out of the game, but still to be seen.
    lion.disableBody(true, false)
    lion.anims.stop()
    lion.setFrame(LION_FRAMES.lyingDown)
    this.tweens.add({
      targets: lion,
      alpha: 0,
      delay: 400,
      duration: 500,
      onComplete: () => lion.setVisible(false),
    })
  }

  // Which level Nephi is on, for the guards and lions: 'ground', 'above' (a
  // roof or platform) or 'ladder'. In the air he's still on the one he
  // jumped from.
  updatePlane(onGround) {
    if (this.climbing) {
      this.plane = 'ladder'
    } else if (onGround) {
      const onTheGround = this.player.body.bottom >= this.groundY - 4
      this.plane = onTheGround ? 'ground' : 'above'
    }
  }

  // Nephi walks while moving along the ground, holds a stride in the air, and
  // otherwise stands still. (On the ship level the player is the boat.)
  animateNephi(moving) {
    if (this.isShipLevel) {
      return
    }
    const onGround =
      this.player.body.blocked.down || this.player.body.touching.down
    if (moving && onGround) {
      this.player.anims.play(WALKERS.nephi.key, true)
      return
    }
    this.player.anims.stop()
    const frame = onGround ? FRAME_STILL : FRAME_MID_AIR
    this.player.setTexture(WALKERS.nephi.key, frame)
  }

  updateEnemies(time) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) {
        return
      }
      if (this.isShipLevel) {
        this.swim(enemy, time)
      } else if (enemy.getData('hunter')) {
        this.updateHunter(enemy, time)
      } else {
        this.patrol(enemy, time)
      }
    })
  }

  // Back and forth within its range, turning now and then at random.
  patrol(enemy, time) {
    const speed = enemy.getData('speed')
    const direction = enemy.getData('direction')
    const minX = enemy.getData('minX')
    const maxX = enemy.getData('maxX')
    const nextTurnAt = enemy.getData('nextTurnAt') ?? 0
    const turnRange = this.getEnemyTurnDelayRange()

    enemy.body.setVelocityX(direction * speed)
    const jitterChance = this.getEnemyPatrolJitterChance()
    const patrolJitter = time >= nextTurnAt && Math.random() < jitterChance
    if (patrolJitter) {
      enemy.setData('direction', direction * -1)
      enemy.setData(
        'nextTurnAt',
        time + Phaser.Math.Between(turnRange.min, turnRange.max),
      )
    }
    if (enemy.x <= minX) {
      enemy.x = minX
      enemy.setData('direction', 1)
      enemy.setData(
        'nextTurnAt',
        time + Phaser.Math.Between(turnRange.min, turnRange.max),
      )
    } else if (enemy.x >= maxX) {
      enemy.x = maxX
      enemy.setData('direction', -1)
      enemy.setData(
        'nextTurnAt',
        time + Phaser.Math.Between(turnRange.min, turnRange.max),
      )
    }

    // Art faces right by default (same convention as the player sprite),
    // so mirror it whenever the enemy is currently heading left.
    enemy.flipX = enemy.getData('direction') < 0
  }

  // Guards and lions patrol until they see Nephi: facing him, on the ground,
  // within HUNTER_SIGHT. Then they chase him until he leaves the ground (up a
  // ladder, or onto a roof or platform) or gets well away, and patrol again
  // from where they are.
  updateHunter(enemy, time) {
    const dx = this.player.x - enemy.x
    const onTheGround = this.plane === 'ground'
    const lion = enemy.getData('hunter') === 'lion'
    if (lion && time < enemy.getData('dazedUntil')) {
      return
    }
    if (enemy.getData('chasing')) {
      if (onTheGround && Math.abs(dx) <= HUNTER_LOSE_DISTANCE) {
        const direction = dx < 0 ? -1 : 1
        enemy.setData('direction', direction)
        enemy.flipX = direction < 0
        if (lion && time < enemy.getData('roarUntil')) {
          enemy.body.setVelocityX(0)
          return
        }
        if (lion) {
          enemy.anims.play(LION.run, true)
        }
        const speed = HUNTER_CHASE_SPEED[enemy.getData('hunter')]
        enemy.body.setVelocityX(direction * speed)
        return
      }
      this.stopChase(enemy, time)
    } else {
      const facing = Math.sign(dx) === enemy.getData('direction')
      if (onTheGround && facing && Math.abs(dx) <= HUNTER_SIGHT) {
        this.startChase(enemy, time)
        return
      }
    }
    if (lion && this.lionResting(enemy, time)) {
      return
    }
    this.patrol(enemy, time)
  }

  startChase(enemy, time) {
    enemy.setData('chasing', true)
    if (enemy.getData('hunter') === 'lion') {
      // A roar first (see updateHunter).
      enemy.setData({ roarUntil: time + LION_ROAR_MS, restUntil: 0 })
      enemy.anims.stop()
      enemy.setFrame(LION_FRAMES.roar)
      enemy.body.setVelocityX(0)
    } else {
      // Faster steps to match.
      const speed = HUNTER_CHASE_SPEED[enemy.getData('hunter')]
      enemy.anims.timeScale = speed / ENEMY_SPEED
    }
    this.showAlert(enemy, '!')
  }

  stopChase(enemy, time) {
    const turnRange = this.getEnemyTurnDelayRange()
    enemy.setData({
      chasing: false,
      minX: enemy.x - HUNTER_PATROL_RANGE,
      maxX: enemy.x + HUNTER_PATROL_RANGE,
      nextTurnAt: time + Phaser.Math.Between(turnRange.min, turnRange.max),
    })
    if (enemy.getData('hunter') === 'lion') {
      this.restLion(enemy, time + LION_LOOK_MS, LION_FRAMES.stand)
    } else {
      enemy.anims.timeScale = enemy.getData('speed') / ENEMY_SPEED
    }
    this.showAlert(enemy, '?')
  }

  // A lion stops, holding a pose until `until`: standing to look around for
  // Nephi, or sitting down for a rest. He can still spot him meanwhile.
  restLion(lion, until, frame) {
    lion.setData({
      restUntil: until,
      restAt: until + Phaser.Math.Between(...LION_REST_EVERY_MS),
    })
    lion.anims.stop()
    lion.setFrame(frame)
    lion.body.setVelocityX(0)
  }

  // Whether a lion's resting (see restLion), sitting down when it's time
  // for a rest. Otherwise he walks.
  lionResting(lion, time) {
    if (time >= lion.getData('restUntil') && time >= lion.getData('restAt')) {
      const rest = Phaser.Math.Between(...LION_REST_MS)
      this.restLion(lion, time + rest, LION_FRAMES.sit)
    }
    if (time < lion.getData('restUntil')) {
      return true
    }
    lion.anims.play({ key: LION.walk, timeScale: lion.getData('pace') }, true)
    return false
  }

  // A mark over a guard's head that fades away: "!" when he spots Nephi, "?"
  // when he loses him.
  showAlert(enemy, mark) {
    enemy.getData('alert')?.destroy()
    const alert = this.add
      .text(enemy.x, enemy.y - 52, mark, {
        fontFamily: 'Verdana',
        fontSize: '26px',
        fontStyle: 'bold',
        color: mark === '!' ? '#ff5a3c' : '#f2d7a0',
        stroke: '#1a1a1a',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(6)
    enemy.setData('alert', alert)
    this.tweens.add({
      targets: alert,
      alpha: 0,
      delay: 500,
      duration: 400,
      onComplete: () => alert.destroy(),
    })
  }

  followAlert(enemy) {
    const alert = enemy.getData('alert')
    if (alert?.active) {
      alert.setPosition(enemy.x, enemy.y - 52)
    }
  }

  // Each monkey faces Nephi when he's near and throws coconuts at him (see
  // MONKEY_THROWS), resting between throws.
  updateMonkeys(time) {
    for (const monkey of this.monkeys) {
      const { sprite } = monkey
      if (!monkey.throw) {
        const dx = this.player.x - sprite.x
        const near = Math.abs(dx) <= MONKEY_RANGE
        if (near) {
          sprite.flipX = dx < 0
        }
        if (!near || time < monkey.nextThrowAt) {
          sprite.setFrame(MONKEY_FRAMES.sit)
          continue
        }
        monkey.throw = Phaser.Utils.Array.GetRandom(MONKEY_THROWS)
        monkey.step = -1
        monkey.stepEndsAt = time
      }
      if (time < monkey.stepEndsAt) {
        continue
      }
      monkey.step += 1
      const step = monkey.throw[monkey.step]
      if (!step) {
        monkey.throw = null
        monkey.nextThrowAt = time + Phaser.Math.Between(...MONKEY_REST_MS)
        sprite.setFrame(MONKEY_FRAMES.sit)
        continue
      }
      sprite.setFrame(MONKEY_FRAMES[step.pose])
      monkey.stepEndsAt = time + step.ms
      if (step.hand) {
        this.throwCoconut(sprite, step.hand)
      }
    }
    // Any knocked clean out of the level.
    this.coconuts?.getChildren().forEach((coconut) => {
      if (coconut.y > WORLD_HEIGHT + COCONUT_SIZE) {
        coconut.destroy()
      }
    })
  }

  // A coconut from a monkey's hand, at `hand` from his feet (see
  // MONKEY_THROWS), lobbed to land on Nephi where he'll be by then if he
  // keeps going: stopping, turning or jumping dodges it.
  throwCoconut(monkey, [handX, handY]) {
    const facing = monkey.flipX ? -1 : 1
    const x = monkey.x + handX * facing
    const y = monkey.y + handY
    const coconut = this.coconuts.create(x, y, 'coconut')
    coconut.setDisplaySize(COCONUT_SIZE, COCONUT_SIZE).setDepth(2)
    // In the texture's pixels, drawn at 3x.
    const radius = (COCONUT_SIZE * 3) / 2 - 1.5
    coconut.body.setCircle(radius, 1.5, 1.5)
    coconut.setBounce(0.35)
    const across = Math.min(Math.abs(this.player.x - x) / MONKEY_RANGE, 1)
    const flight = Phaser.Math.Linear(...COCONUT_FLIGHT_MS, across) / 1000
    const lead = this.player.body.velocity.x * flight
    const dx = this.player.x + lead - x
    const dy = this.player.y - y
    const gravity = this.physics.world.gravity.y
    coconut.body.setVelocity(
      dx / flight,
      (dy - (gravity * flight * flight) / 2) / flight,
    )
    coconut.setAngularVelocity(COCONUT_SPIN * facing)
    coconut.setData({ live: true, landed: false })
  }

  // A coconut that lands is harmless: it rolls to a stop and fades away.
  landCoconut(coconut) {
    if (coconut.getData('landed')) {
      return
    }
    coconut.setData({ landed: true, live: false })
    coconut.body.setDragX(260)
    coconut.setAngularDrag(500)
    this.tweens.add({
      targets: coconut,
      alpha: 0,
      delay: 900,
      duration: 400,
      onComplete: () => coconut.destroy(),
    })
  }

  hitByCoconut(coconut) {
    if (
      this.levelFinished ||
      this.time.now < this.invincibleUntil ||
      this.game.loop.time < this.hurtUntil
    ) {
      return
    }
    // Not if he's swinging his sword at it.
    if (this.batCoconut(coconut)) {
      return
    }
    coconut.setData('live', false)
    this.hurtNephi(coconut.x)
  }

  // Knocks a flying coconut away, if Nephi's swinging his sword and it's in
  // reach (see SWORD_BAT_REACH). Whether it did.
  batCoconut(coconut) {
    if (!this.sword || !coconut.getData('live')) {
      return false
    }
    const t = this.game.loop.time - this.swingStartedAt
    if (t < 0 || t > SWORD_BAT_MS) {
      return false
    }
    const facing = this.player.flipX ? -1 : 1
    const [gripX, gripY] = this.swordGrip()
    const x = this.player.x + gripX * facing
    const y = this.player.y + gripY - SWORD_BLADE / 2
    const ahead = (coconut.x - this.player.x) * facing
    const distance = Phaser.Math.Distance.Between(x, y, coconut.x, coconut.y)
    if (ahead < -COCONUT_SIZE || distance > SWORD_BAT_REACH) {
      return false
    }
    coconut.setData('live', false)
    coconut.body.setVelocity(facing * 420, -360)
    coconut.setAngularVelocity(COCONUT_SPIN * 2 * facing)
    this.burst(coconut.x, coconut.y, 6, 2.5, 200)
    return true
  }

  // A flash of light at (x, y) that grows and fades: a blow landing.
  burst(x, y, radius, scale, duration) {
    const burst = this.add.circle(x, y, radius, 0xfff3c4, 0.85).setDepth(5)
    this.tweens.add({
      targets: burst,
      scale,
      alpha: 0,
      duration,
      onComplete: () => burst.destroy(),
    })
  }

  updateInvincibility(time) {
    if (time < this.invincibleUntil) {
      const secondsLeft = Math.ceil((this.invincibleUntil - time) / 1000)
      this.invincibleText
        .setText(`Invincible: ${secondsLeft}s`)
        .setVisible(true)
      this.player.setTint(0x8ff7d2)
    } else {
      this.invincibleText.setVisible(false)
      this.player.clearTint()
    }
    // Blinking after a hit, while he can't be hurt again.
    const faded =
      time < this.hurtUntil && Math.floor(time / HURT_BLINK_MS) % 2 === 0
    this.player.setAlpha(faded ? 0.3 : 1)
    this.sword?.setAlpha(faded ? 0.3 : 1)
  }

  // A hit from an enemy or a coconut at `fromX`: it costs Nephi a heart,
  // knocks him away from it (the boat just blinks) and leaves him unhurtable
  // for a while. Losing the last heart starts the journey again.
  hurtNephi(fromX) {
    this.hearts -= 1
    const lost = this.heartIcons[this.hearts]
    lost.setTexture('heart-lost')
    this.tweens.add({
      targets: lost,
      scale: { from: 1.6, to: 1 },
      duration: 300,
      ease: 'Back.Out',
    })
    if (this.hearts <= 0) {
      this.outOfHearts()
      return
    }
    const now = this.game.loop.time
    this.hurtUntil = now + HURT_MS
    if (!this.isShipLevel) {
      if (this.climbing) {
        this.letGoOfLadder()
      }
      const away =
        Math.sign(this.player.x - fromX) || (this.player.flipX ? 1 : -1)
      this.staggerUntil = now + HURT_STAGGER_MS
      this.player.setVelocity(away * HURT_KNOCKBACK[0], -HURT_KNOCKBACK[1])
    }
  }

  // Everything stops, and after a moment the journey starts again from
  // level 1, with all his hearts.
  outOfHearts() {
    this.levelFinished = true
    this.physics.world.pause()
    this.player.setTint(0xff6b6b).setAlpha(1)
    this.sword?.setAlpha(1)
    // Big, in the middle of the screen, over everything, which dims.
    const { width, height } = this.scale
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.5)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(60)
    const message = this.add
      .container(width / 2, height / 2, [
        this.add
          .text(0, -18, 'Out of hearts!', {
            fontFamily: 'Verdana',
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#ff6b6b',
            stroke: '#1a0a0a',
            strokeThickness: 8,
          })
          .setOrigin(0.5, 1),
        this.add
          .text(0, 0, 'Back to the start of the journey...', {
            fontFamily: 'Verdana',
            fontSize: '26px',
            color: '#f7edd9',
            stroke: '#1a0a0a',
            strokeThickness: 5,
          })
          .setOrigin(0.5, 0),
      ])
      .setScrollFactor(0)
      .setDepth(61)
    this.tweens.add({
      targets: message,
      scale: { from: 0.6, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 350,
      ease: 'Back.Out',
    })
    this.time.delayedCall(OUT_OF_HEARTS_MS, () => {
      this.scene.start('StoryScene', { levelIndex: 0 })
    })
  }

  collectScroll(player, scroll) {
    if (!scroll.active) {
      return
    }

    const popupText =
      scroll.getData('popupText') || 'A treasured scroll has been collected.'
    scroll.disableBody(true, true)
    this.scrollsCollected += 1
    if (this.scrollCountText) {
      this.scrollCountText.setText(
        `Scrolls: ${this.scrollsCollected}/${this.totalScrolls || 2}`,
      )
    }

    // Freeze gameplay while the player reads the scroll text - both the
    // Arcade physics step (so nothing moves or collides) and our own
    // update() loop (see the gamePaused check there, which also covers
    // the ship level's manual, non-physics position updates).
    this.gamePaused = true
    this.physics.world.pause()
    // And stop the guards marching on the spot.
    this.anims.pauseAll()

    this.showScrollPopup(popupText, () => {
      this.physics.world.resume()
      this.anims.resumeAll()
      this.gamePaused = false
      // Invincibility starts fresh from the moment the game resumes, not
      // from when the scroll was picked up.
      this.invincibleUntil = this.time.now + INVINCIBILITY_MS
      // Space (and Up/W) can also close the popup, so clear their "just
      // pressed" state - otherwise that same keypress also registers as a
      // jump input the instant update() starts running again.
      this.cursors.up.reset()
      this.keySpace.reset()
      this.keyW.reset()
      this.touch.clearJump()
    })
  }

  // Shrinks the font (down to a floor) until the wrapped message fits within
  // a sane height, so extremely long scroll text (some are full paragraphs
  // of scripture) doesn't grow the popup past the playable screen.
  fitScrollPopupText(message) {
    let fontSize = SCROLL_POPUP_BASE_FONT
    this.scrollPopupText.setFontSize(fontSize)
    this.scrollPopupText.setText(message)
    while (
      this.scrollPopupText.height > SCROLL_POPUP_MAX_TEXT_HEIGHT &&
      fontSize > SCROLL_POPUP_MIN_FONT
    ) {
      fontSize -= 1
      this.scrollPopupText.setFontSize(fontSize)
    }
  }

  // Resizes and repositions the background box, title, body text, and
  // Proceed button as a group so the box always fully encloses whatever
  // text was just set, instead of using a fixed box size that longer
  // messages could overflow.
  layoutScrollPopup() {
    const titleHeight = this.scrollPopupTitle.height
    const textHeight = this.scrollPopupText.height
    const buttonHeight = this.scrollPopupButton.height
    const boxHeight =
      SCROLL_POPUP_PADDING_TOP +
      titleHeight +
      SCROLL_POPUP_TITLE_GAP +
      textHeight +
      SCROLL_POPUP_BUTTON_GAP +
      buttonHeight +
      SCROLL_POPUP_PADDING_BOTTOM
    const boxCenterY = SCROLL_POPUP_TOP + boxHeight / 2
    const centerX = this.scale.width / 2

    this.scrollPopupBg.setSize(SCROLL_POPUP_WIDTH, boxHeight)
    this.scrollPopupBg.setPosition(centerX, boxCenterY)

    const titleCenterY =
      SCROLL_POPUP_TOP + SCROLL_POPUP_PADDING_TOP + titleHeight / 2
    this.scrollPopupTitle.setPosition(centerX, titleCenterY)

    const textCenterY =
      titleCenterY + titleHeight / 2 + SCROLL_POPUP_TITLE_GAP + textHeight / 2
    this.scrollPopupText.setPosition(centerX, textCenterY)

    const buttonCenterY =
      textCenterY + textHeight / 2 + SCROLL_POPUP_BUTTON_GAP + buttonHeight / 2
    this.scrollPopupButton.setPosition(centerX, buttonCenterY)
  }

  // Shows the scroll popup and pauses gameplay until the player clicks
  // Proceed, then calls onProceed (used by collectScroll to resume the
  // game and start invincibility from that exact moment).
  showScrollPopup(message, onProceed) {
    this.scrollPopupTitle.setText('Scroll Found')
    this.fitScrollPopupText(message)
    this.layoutScrollPopup()

    const elements = [
      this.scrollPopupBg,
      this.scrollPopupText,
      this.scrollPopupTitle,
      this.scrollPopupButton,
    ]
    elements.forEach((element) => {
      element.setVisible(true)
      element.setAlpha(0)
    })

    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 180,
      ease: 'Sine.easeOut',
    })

    const proceed = () => {
      this.scrollPopupButton.off('pointerdown', proceed)
      this.input.keyboard.off('keydown-ENTER', proceed)
      this.input.keyboard.off('keydown-SPACE', proceed)
      this.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 220,
        ease: 'Sine.easeIn',
        onComplete: () => {
          elements.forEach((element) => element.setVisible(false))
          onProceed()
        },
      })
    }

    this.scrollPopupButton.on('pointerdown', proceed)
    this.input.keyboard.on('keydown-ENTER', proceed)
    this.input.keyboard.on('keydown-SPACE', proceed)
  }

  handleEnemyHit(player, enemy) {
    if (this.time.now < this.invincibleUntil || this.levelFinished) {
      return
    }
    // A lion knocked flying can't hurt him, or be hit again yet.
    if (enemy.getData('knockedUntil') > this.game.loop.time) {
      return
    }

    const playerBody = player.body
    const enemyBody = enemy.body
    const isFalling = playerBody.velocity.y > 0
    const landingThreshold = enemyBody.y + 16
    const playerBottom = playerBody.y + playerBody.height

    if (!this.isShipLevel && isFalling && playerBottom <= landingThreshold) {
      if (enemy.getData('hunter') === 'lion') {
        this.hitLion(enemy, Math.sign(enemy.x - player.x) || 1)
      } else {
        enemy.disableBody(true, true)
      }
      if (playerBody) {
        playerBody.velocity.y = -PLAYER_JUMP * 0.55
      }
      return
    }

    // Still blinking from the last hit.
    if (this.game.loop.time < this.hurtUntil) {
      return
    }
    this.hurtNephi(enemy.x)
  }

  handleGoalReached() {
    this.triggerNextLevel()
  }

  triggerNextLevel() {
    if (this.levelFinished) {
      return
    }

    this.levelFinished = true
    this.statusText.setText('Level complete!').setVisible(true)
    this.player.setVelocity(0, 0)

    this.time.delayedCall(700, () => {
      const nextLevel = this.levelIndex + 1
      if (nextLevel >= LEVELS.length) {
        this.scene.start('EndingScene')
      } else {
        this.scene.start('StoryScene', { levelIndex: nextLevel })
      }
    })
  }

  // Keeps Nephi in the middle of the view. Phaser draws the view and each
  // sprite at whole pixels, rounding them separately, so the view is kept to
  // his rounded position, or he'd shift a pixel to and fro against it.
  applyCamera() {
    const camera = this.cameras.main
    camera.scrollX = Phaser.Math.Clamp(
      Math.round(this.player.x) - camera.width / 2,
      0,
      WORLD_WIDTH - camera.width,
    )
  }
}

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#10141a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY_Y },
      debug: false,
    },
  },
  scene: [BootScene, StoryScene, GameScene, EndingScene],
}

export function start(container) {
  const game = new Phaser.Game({ ...config, parent: container })
  // Phaser only checks its box's size now and then, and can miss a change:
  // turning a phone sideways in full screen left the game sized for upright.
  // So measure the box and resize the game whenever the box changes size.
  const resize = new ResizeObserver(() => {
    if (game.isBooted) {
      game.scale.getParentBounds()
      game.scale.refresh()
    }
  })
  resize.observe(container)
  return function stop() {
    resize.disconnect()
    game.destroy(true)
  }
}
