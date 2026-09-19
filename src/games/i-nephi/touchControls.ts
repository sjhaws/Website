// Touch controls for I, Nephi: slide a finger to walk, tap or flick up to
// jump. No buttons are drawn; any finger anywhere in the game's box works.
//
// - The first finger down steers. Sliding it more than DEAD_ZONE pixels left
//   or right of where it landed walks that way. That point follows the finger
//   once it's more than LEASH pixels away, so turning around never takes a
//   long slide back.
// - A quick tap jumps, as does a quick flick upward, which lets the steering
//   finger jump without lifting. So does any other finger touching down while
//   one is steering, which is the fastest way with two thumbs.
//
// Distances are in CSS pixels and times in milliseconds, both as given by
// pointer events.

export const DEAD_ZONE = 10
export const LEASH = 24
export const TAP_MS = 250
/** A tap moves less than this. */
export const TAP_SLOP = 10
export const FLICK_DISTANCE = 30
export const FLICK_MS = 200
/** A jump asked for this soon before landing still happens on landing. */
export const JUMP_BUFFER_MS = 120

interface Point {
  x: number
  y: number
  time: number
}

interface Steering {
  id: number
  /** Where "not walking" is: where the finger landed, or following it. */
  anchorX: number
  start: Point
  /** Recent positions, for spotting a flick. */
  recent: Point[]
  moved: boolean
  jumped: boolean
}

export class SlideControls {
  /** -1 to walk left, 1 to walk right, 0 to stand. */
  direction: -1 | 0 | 1 = 0
  private jumpAt: number | null = null
  private steering: Steering | null = null
  /** Other fingers that are down, by pointer id, and where they are. */
  private others = new Map<number, Point>()

  /**
   * A finger touches down. While `paused` (say, for a message) the finger is
   * ignored until it lifts, so tapping the message's button doesn't jump.
   */
  down(id: number, x: number, y: number, time: number, paused = false) {
    if (paused) {
      return
    }
    if (this.steering) {
      this.others.set(id, { x, y, time })
      this.jumpAt = time
      // That was the jump, so the steering finger lifting isn't a tap.
      this.steering.jumped = true
    } else {
      this.steer(id, { x, y, time })
    }
  }

  move(id: number, x: number, y: number, time: number) {
    if (this.others.has(id)) {
      this.others.set(id, { x, y, time })
    }
    const steering = this.steering
    if (!steering || steering.id !== id) {
      return
    }
    const { start } = steering
    if (Math.hypot(x - start.x, y - start.y) >= TAP_SLOP) {
      steering.moved = true
    }

    steering.anchorX = Math.min(
      Math.max(steering.anchorX, x - LEASH),
      x + LEASH,
    )
    const dx = x - steering.anchorX
    this.direction = dx > DEAD_ZONE ? 1 : dx < -DEAD_ZONE ? -1 : 0

    // Where the finger has been in the last FLICK_MS. A finger resting
    // still sends no events, so its last position before then counts too.
    const since = time - FLICK_MS
    const resting = steering.recent.filter((p) => p.time < since).at(-1)
    steering.recent = [
      ...(resting ? [{ ...resting, time: since }] : []),
      ...steering.recent.filter((p) => p.time >= since),
      { x, y, time },
    ]
    const lowest = Math.max(...steering.recent.map((p) => p.y))
    if (lowest - y >= FLICK_DISTANCE) {
      this.jumpAt = time
      steering.jumped = true
      // The flick is used up; it takes another to jump again.
      steering.recent = [{ x, y, time }]
    }
  }

  /** A finger lifts. */
  up(id: number, time: number) {
    const steering = this.steering
    if (steering?.id === id) {
      const quick = time - steering.start.time <= TAP_MS
      if (quick && !steering.moved && !steering.jumped) {
        this.jumpAt = time
      }
    }
    this.lift(id)
  }

  /** The browser took a finger away, for a gesture of its own: no tap. */
  cancel(id: number) {
    this.lift(id)
  }

  /** Whether a jump was asked for within the last JUMP_BUFFER_MS. */
  wantsJump(now: number): boolean {
    return this.jumpAt !== null && now - this.jumpAt <= JUMP_BUFFER_MS
  }

  /** The jump happened, so forget the request. */
  clearJump() {
    this.jumpAt = null
  }

  private steer(id: number, point: Point): Steering {
    this.steering = {
      id,
      anchorX: point.x,
      start: point,
      recent: [point],
      moved: false,
      jumped: false,
    }
    return this.steering
  }

  private lift(id: number) {
    this.others.delete(id)
    if (this.steering?.id !== id) {
      return
    }
    this.steering = null
    this.direction = 0
    // Another finger still down takes over steering from where it is. It
    // isn't a new touch, so lifting it later isn't a tap.
    const [next] = [...this.others]
    if (next) {
      const [nextId, point] = next
      this.others.delete(nextId)
      this.steer(nextId, point).moved = true
    }
  }
}
