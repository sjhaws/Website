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

// How far each part of a walker moves, in pixels on screen, at one step.
function walkPose(walker, step) {
  const angle = (2 * Math.PI * step) / ANIM_STEPS
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const { stride, lift, dip } = walker
  return {
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

function drawWalkStep(pen, walker, step) {
  const pose = walkPose(walker, step)
  const { width, height } = pen
  const [feetLeft, feetSplit, feetRight] = walker.feet
  const hem = walker.hemY
  const below = height - hem
  const dip = pen.toArt([0, pose.body])[1]

  // Feet first, so clothes hide the top of a lifted foot.
  pen.copy([feetLeft, hem, feetSplit - feetLeft, below], pen.toArt(pose.back))
  pen.copy(
    [feetSplit, hem, feetRight - feetSplit, below],
    pen.toArt(pose.front),
  )
  // Then the rest of the body, including anything beside the feet.
  pen.copy([0, 0, width, hem], [0, dip])
  pen.copy([0, hem, feetLeft, below], [0, dip])
  pen.copy([feetRight, hem, width - feetRight, below], [0, dip])
  // And the hands, swung.
  const hands = pose.hands.map(([x, y]) => pen.toArt([x, y]))
  moveParts(pen, walker.hands, hands, dip)
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
  moveParts(pen, boxes, offsets, 0, source)
}

// Lifts `parts` off the frame (see "Parts that move as a whole" above) and
// puts them back moved by `offsets`, in art pixels, and down by `lower`.
function moveParts(pen, parts, offsets, lower, source = pen.art) {
  for (const part of parts) {
    const [x, , w, h] = part.box
    pen.within(part, [0, lower], (px, py) => {
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
      pen.within(part, [trailX ? 0 : dx, lower + (trailY ? 0 : dy)], put)
    }
    pen.within(part, [dx, lower + dy], put)
  })
}

// Makes texture spec.key from the art: frame 0 as drawn, then each step of
// the loop drawn by drawStep(pen, step). Also makes the looping animation
// spec.key from those steps.
function buildFrames(scene, spec, drawStep) {
  const { key } = spec
  if (scene.textures.exists(key)) {
    return
  }
  const art = scene.textures.get(spec.art).getSourceImage()
  const { width, height } = art
  // Art pixels per pixel on screen, across and down.
  const unitX = width / spec.display[0]
  const unitY = height / spec.display[1]
  const margin = Math.round(ANIM_MARGIN * unitX)
  const frameWidth = width + 2 * margin
  const steps = [...Array(ANIM_STEPS).keys()]
  const sheet = scene.textures.createCanvas(
    key,
    frameWidth * (ANIM_STEPS + 1),
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

// Level 6's sharks and whales cruise back and forth under the water. Now and
// then one near the boat dashes under where the boat is, surges up through
// the surface and dives again. Speeds are in pixels a second; `depth` is how far below the
// waterline each cruises, and `hitbox` covers its body, in pixels on screen
// from the art's top left.
const SEA_CREATURES = {
  shark: { speed: 85, rise: 175, depth: [70, 120], hitbox: [12, 12, 56, 14] },
  whale: { speed: 50, rise: 120, depth: [90, 140], hitbox: [18, 14, 98, 30] },
}
// How far each cruises either side of where it starts.
const SEA_RANGE = 280
// It only rises at a boat within this distance, across.
const SEA_REACH = 380
// Milliseconds between rises.
const SEA_WAIT = [1800, 4500]
// How far above the waterline the middle of a rising creature gets.
const SEA_BREACH = 2
// How close across it gets before surging up.
const SEA_STRIKE = 60
const SEA_PACE_VARIATION = 0.2

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
    platforms: [
      { x: 300, y: 360, width: 128 },
      { x: 620, y: 304, width: 160 },
      { x: 980, y: 248, width: 160 },
      { x: 1360, y: 292, width: 128 },
      { x: 1760, y: 232, width: 192 },
      { x: 2200, y: 286, width: 160 },
      { x: 2700, y: 240, width: 160 },
      { x: 3180, y: 304, width: 192 },
      { x: 3720, y: 260, width: 160 },
      { x: 4300, y: 328, width: 160 },
    ],
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
    '1Nephi 2:3-4\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4  And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.',
    '1Nephi 2: 5-6\n\n5 And he came down by the borders near the shore of the Red Sea; and he traveled in the wilderness in the borders which are nearer the Red Sea; and he did travel in the wilderness with his family, which consisted of my mother, Sariah, and my elder brothers, who were Laman, Lemuel, and Sam.\n\n6 And it came to pass that when he had traveled three days in the wilderness, he pitched his tent in a valley by the side of a river of water.',
  ],
  [
    '1Nephi 3:9-11\n\n9 And I, Nephi, and my brethren took our journey in the wilderness, with our tents, to go up to the land of Jerusalem.\n\n10 And it came to pass that when we had gone up to the land of Jerusalem, I and my brethren did consult one with another.\n\n11 And we cast lots—who of us should go in unto the house of Laban. And it came to pass that the lot fell upon Laman; and Laman went in unto the house of Laban, and he talked with him as he sat in his house.',
    '1Nephi 3:12-14\n\nFor behold, he knew that Jerusalem must be destroyed, because of the wickedness of the people. For behold, they have rejected the words of the prophets. Wherefore, if my father should dwell in the land after he hath been commanded to flee out of the land, behold, he would perish; wherefore, it must needs be that he flee out of the land.12 And he desired of Laban the records which were engraven upon the plates of brass, which contained the genealogy of my father.\n\n13 And behold, it came to pass that Laban was angry, and thrust him out from his presence; and he would not that he should have the records. Wherefore, he said unto him: Behold thou art a robber, and I will slay thee.\n\n14 But Laman fled out of his presence, and told the things which Laban had done, unto us. And we began to be exceedingly sorrowful, and my brethren were about to return unto my father in the wilderness.',
    '1Nephi 3:22-27\n\nAnd it came to pass that the angel of the Lord spake unto them again, saying: Go up, for the Lord will deliver Laban into your hands22 And it came to pass that we went down to the land of our inheritance, and we did gather together our gold, and our silver, and our precious things.\n\n23 And after we had gathered these things together, we went up again unto the house of Laban.\n\n24 And it came to pass that we went in unto Laban, and desired him that he would give unto us the records which were engraven upon the plates of brass, for which we would give unto him our gold, and our silver, and all our precious things.\n\n25 And it came to pass that when Laban saw our property, and that it was exceedingly great, he did lust after it, insomuch that he thrust us out, and sent his servants to slay us, that he might obtain our property.\n\n26 And it came to pass that we did flee before the servants of Laban, and we were obliged to leave behind our property, and it fell into the hands of Laban.\n\n27 And it came to pass that we fled into the wilderness, and the servants of Laban did not overtake us, and we hid ourselves in the cavity of a rock.',
  ],
  [
    "Jerusalem's streets are crowded and dangerous.",
    'Wisdom is needed to move unseen.',
    'The book lies deeper within the city.',
  ],
  [
    'The desert is still harsh, but family gives strength.',
    'Every mile carries them closer together again.',
    'Hope keeps their feet moving across the sand.',
  ],
  [
    'The coast appears like a promise on the horizon.',
    'Fresh water and open air renew the journey.',
    'The family presses on toward the sea path ahead.',
  ],
  [
    'The sea is wide, but hope sails with them.',
    'The promised land draws near at last.',
    'The ship cuts onward through the waves of promise.',
  ],
]

const LEVELS = [
  {
    name: 'Level 1',
    title: 'Leaving Jerusalem',
    story:
      'Nephi must cross the desert, dodge snakes and scorpions, and reach his tent in the wilderness.',
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
      '1Nephi 3:1-7\n\n1 And it came to pass that I, Nephi, returned from speaking with the Lord, to the tent of my father.\n\n2 And it came to pass that he spake unto me, saying: Behold I have dreamed a dream, in the which the Lord hath commanded me that thou and thy brethren shall return to Jerusalem.\n\n3 For behold, Laban hath the record of the Jews and also a genealogy of my forefathers, and they are engraven upon plates of brass.\n\n4 Wherefore, the Lord hath commanded me that thou and thy brothers should go unto the house of Laban, and seek the records, and bring them down hither into the wilderness.\n\n5 And now, behold thy brothers murmur, saying it is a hard thing which I have required of them; but behold I have not required it of them, but it is a commandment of the Lord.\n\n6 Therefore go, my son, and thou shalt be favored of the Lord, because thou hast not murmured.\n\n7 And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.',
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
      'Nephi moves through the city streets to find a book while city guards patrol ahead.',
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
      'With the book in hand, Nephi travels back through the desert to find his family again.',
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
      'Nephi and his family leave the tent behind and journey toward a coastal paradise.',
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
      'The final journey carries the family by boat over the sea toward the promised land.',
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
      buildFrames(this, walker, (pen, step) => drawWalkStep(pen, walker, step))
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
    const howToPlay = touchScreen
      ? onShip
        ? 'Slide a finger left or right to steer.'
        : 'Slide a finger to walk. Tap or flick up to jump.'
      : onShip
        ? 'Use the arrow keys to steer.'
        : 'Use the arrow keys to move and Space to jump.'
    const hint = this.add
      .text(width / 2, 0, howToPlay, {
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
    this.levelFinished = false
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
    this.buildScrolls()
    this.buildGoal()
    this.buildHUD()
    this.setupTouch()
    this.setupInputs()
    this.applyCamera()

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

    const levelOverlay = this.add.graphics().setAlpha(0.16)
    levelOverlay.fillStyle(groundTop, 1)
    levelOverlay.fillRect(0, groundY - 80, WORLD_WIDTH, 80)
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
      this.player.setBounce(0)
      this.player.setDragX(900)
    } else {
      this.setDisplayBodyBox(this.player, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT)
      this.player.setBounce(0.05)
      this.player.setDragX(1100)

      this.physics.add.collider(this.player, this.groundTiles)
      this.physics.add.collider(this.player, this.ledges)
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

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyHit,
      null,
      this,
    )
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
      // A little longer at first, to give the boat a moment.
      nextRiseAt:
        this.time.now + SEA_WAIT[0] + Phaser.Math.Between(...SEA_WAIT),
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
            // Aim at where the boat is now, so it can still get away.
            enemy.setData({ mode: 'rise', targetX: this.player.x })
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
          // Dash along underneath first...
          vx = Math.sign(dx) * rise
          vy = Phaser.Math.Clamp(
            (enemy.getData('cruiseY') - enemy.y) * 3,
            -60,
            60,
          )
        } else {
          // ...then surge up at the spot.
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

    this.statusText = this.add
      .text(18, 56, '', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#f2c14e',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)

    this.invincibleText = this.add
      .text(18, 94, '', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#5ad1a5',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setScrollFactor(0)

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
      this.animateNephi(false)
      return
    }

    const walk = this.touch.direction
    const leftPressed = this.cursors.left.isDown || this.keyA.isDown || walk < 0
    const rightPressed =
      this.cursors.right.isDown || this.keyD.isDown || walk > 0
    const jumpPressed =
      !this.isShipLevel &&
      (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keySpace) ||
        Phaser.Input.Keyboard.JustDown(this.keyW) ||
        this.touch.wantsJump(performance.now()))

    if (this.isShipLevel) {
      let shipMove = 0
      if (leftPressed && !rightPressed) {
        shipMove = -PLAYER_SPEED
        this.player.flipX = true
      } else if (rightPressed && !leftPressed) {
        shipMove = PLAYER_SPEED
        this.player.flipX = false
      }

      this.player.setVelocityX(0)
      this.player.setVelocityY(0)
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
      if (leftPressed && !rightPressed) {
        this.player.setVelocityX(-PLAYER_SPEED)
        this.player.flipX = true
      } else if (rightPressed && !leftPressed) {
        this.player.setVelocityX(PLAYER_SPEED)
        this.player.flipX = false
      } else {
        this.player.setVelocityX(0)
      }

      const onGround =
        this.player.body.blocked.down || this.player.body.touching.down
      if (jumpPressed && onGround) {
        this.player.setVelocityY(-PLAYER_JUMP)
        this.touch.clearJump()
      }

      this.animateNephi(leftPressed !== rightPressed)
    }

    this.updateEnemies(time)
    this.updateInvincibility(time)
    this.applyCamera()
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
    this.player.setFrame(onGround ? FRAME_STILL : FRAME_MID_AIR)
  }

  updateEnemies(time) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy) {
        return
      }
      const speed = enemy.getData('speed')

      if (this.isShipLevel) {
        this.swim(enemy, time)
      } else {
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
    })
  }

  updateInvincibility(time) {
    if (time < this.invincibleUntil) {
      const secondsLeft = Math.ceil((this.invincibleUntil - time) / 1000)
      this.invincibleText.setText(`Invincible: ${secondsLeft}s`)
      this.player.setTint(0x8ff7d2)
    } else {
      this.invincibleText.setText('')
      this.player.clearTint()
    }
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

    const playerBody = player.body
    const enemyBody = enemy.body
    const isFalling = playerBody.velocity.y > 0
    const landingThreshold = enemyBody.y + 16
    const playerBottom = playerBody.y + playerBody.height

    if (!this.isShipLevel && isFalling && playerBottom <= landingThreshold) {
      enemy.disableBody(true, true)
      if (playerBody) {
        playerBody.velocity.y = -PLAYER_JUMP * 0.55
      }
      return
    }

    this.restartLevel()
  }

  handleGoalReached() {
    this.triggerNextLevel()
  }

  triggerNextLevel() {
    if (this.levelFinished) {
      return
    }

    this.levelFinished = true
    this.statusText.setText('Level complete!')
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

  restartLevel() {
    this.scene.restart({ levelIndex: this.levelIndex })
  }

  applyCamera() {
    const camera = this.cameras.main
    camera.scrollX = Phaser.Math.Clamp(
      this.player.x - camera.width / 2,
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
  return function stop() {
    game.destroy(true)
  }
}
