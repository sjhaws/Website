import { describe, expect, it } from 'vitest'
import {
  CLIMB_DEAD_ZONE,
  DEAD_ZONE,
  FLICK_DISTANCE,
  JUMP_BUFFER_MS,
  LEASH,
  SlideControls,
  TAP_MS,
} from './touchControls.ts'

const FINGER = 1
const THUMB = 2

describe('walking', () => {
  it('stands until the finger slides past the dead zone, then walks that way', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 100 + DEAD_ZONE, 300, 20)
    expect(touch.direction).toBe(0)
    touch.move(FINGER, 100 + DEAD_ZONE + 1, 300, 40)
    expect(touch.direction).toBe(1)
    touch.move(FINGER, 100 - DEAD_ZONE - 1, 300, 60)
    expect(touch.direction).toBe(-1)
  })

  it('ignores up and down movement', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 100, 360, 500)
    expect(touch.direction).toBe(0)
  })

  it('turns around after a short slide back, however far the finger went', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 300, 300, 100) // far to the right
    expect(touch.direction).toBe(1)
    touch.move(FINGER, 300 - LEASH, 300, 200) // back to where it's "still"
    expect(touch.direction).toBe(0)
    touch.move(FINGER, 300 - LEASH - DEAD_ZONE - 1, 300, 300)
    expect(touch.direction).toBe(-1)
  })

  it('stops when the finger lifts', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 150, 300, 100)
    touch.up(FINGER, 600)
    expect(touch.direction).toBe(0)
  })
})

describe('jumping', () => {
  it('jumps on a quick tap, not on a slow press or a slide', () => {
    const tap = new SlideControls()
    tap.down(FINGER, 100, 300, 1000)
    tap.up(FINGER, 1000 + TAP_MS)
    expect(tap.wantsJump(1000 + TAP_MS)).toBe(true)

    const press = new SlideControls()
    press.down(FINGER, 100, 300, 1000)
    press.up(FINGER, 1000 + TAP_MS + 1)
    expect(press.wantsJump(1000 + TAP_MS + 1)).toBe(false)

    const slide = new SlideControls()
    slide.down(FINGER, 100, 300, 1000)
    slide.move(FINGER, 140, 300, 1050)
    slide.up(FINGER, 1100)
    expect(slide.wantsJump(1100)).toBe(false)
  })

  it('jumps on a quick flick up while steering, once per flick', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.move(FINGER, 140, 300, 1100) // walking right
    touch.move(FINGER, 142, 300 - FLICK_DISTANCE, 1200)
    expect(touch.wantsJump(1200)).toBe(true)
    expect(touch.direction).toBe(1)

    touch.clearJump()
    touch.move(FINGER, 144, 300 - FLICK_DISTANCE - 10, 1220)
    expect(touch.wantsJump(1220)).toBe(false)
    // Lifting after a flick isn't also a tap.
    touch.up(FINGER, 1230)
    expect(touch.wantsJump(1230)).toBe(false)
  })

  it('spots a flick from a finger that was resting still', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.move(FINGER, 140, 300, 1100) // walking, then resting
    touch.move(FINGER, 140, 300 - FLICK_DISTANCE, 2000) // one quick event
    expect(touch.wantsJump(2000)).toBe(true)
  })

  it('does not count a slow upward slide as a flick', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    for (let i = 1; i <= 10; i++) {
      touch.move(FINGER, 100, 300 - i * 5, 1000 + i * 100)
    }
    expect(touch.wantsJump(2000)).toBe(false)
  })

  it('jumps the moment a second finger touches down', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.move(FINGER, 140, 300, 1100)
    touch.down(THUMB, 600, 300, 1150)
    expect(touch.wantsJump(1150)).toBe(true)
    expect(touch.direction).toBe(1) // still walking
  })

  it('keeps a jump request only briefly, for landing', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.up(FINGER, 1050)
    expect(touch.wantsJump(1050 + JUMP_BUFFER_MS)).toBe(true)
    expect(touch.wantsJump(1050 + JUMP_BUFFER_MS + 1)).toBe(false)
  })

  it('does not jump for a cancelled touch', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.cancel(FINGER)
    expect(touch.wantsJump(1050)).toBe(false)
  })
})

describe('while paused', () => {
  it('ignores a finger that touched down, even after the game resumes', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000, true) // tapping a message's button
    touch.move(FINGER, 200, 300, 1100)
    expect(touch.direction).toBe(0)
    touch.up(FINGER, 1150)
    expect(touch.wantsJump(1150)).toBe(false)
  })
})

describe('two fingers', () => {
  it('hands steering to the other finger when the first lifts', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 1000)
    touch.down(THUMB, 600, 300, 1100) // jumps
    touch.clearJump()
    touch.up(FINGER, 1200)
    touch.move(THUMB, 600 + DEAD_ZONE + 1, 300, 1250)
    expect(touch.direction).toBe(1)
    // It was already down, so lifting it quickly isn't a tap.
    touch.up(THUMB, 1260)
    expect(touch.wantsJump(1260)).toBe(false)
  })
})

describe('climbing', () => {
  it('climbs up or down once the finger slides past the climbing dead zone', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 100, 300 - CLIMB_DEAD_ZONE, 400)
    expect(touch.vertical).toBe(0)
    touch.move(FINGER, 100, 300 - CLIMB_DEAD_ZONE - 1, 800)
    expect(touch.vertical).toBe(-1)
    touch.move(FINGER, 100, 360, 1200)
    expect(touch.vertical).toBe(1)
    touch.up(FINGER, 1300)
    expect(touch.vertical).toBe(0)
  })

  it('does not climb for a finger drifting a little while walking', () => {
    const touch = new SlideControls()
    touch.down(FINGER, 100, 300, 0)
    touch.move(FINGER, 160, 290, 400)
    expect(touch.direction).toBe(1)
    expect(touch.vertical).toBe(0)
  })

  it('can leave out flicks, so a flick up on a ladder climbs instead', () => {
    const flick = new SlideControls()
    flick.down(FINGER, 100, 300, 1000)
    flick.move(FINGER, 100, 260, 1100)
    expect(flick.wantsJump(1100)).toBe(true)
    expect(flick.wantsJump(1100, { flicks: false })).toBe(false)

    const tap = new SlideControls()
    tap.down(FINGER, 100, 300, 1000)
    tap.up(FINGER, 1080)
    expect(tap.wantsJump(1080, { flicks: false })).toBe(true)
  })
})
