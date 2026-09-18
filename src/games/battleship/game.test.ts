import { describe, expect, it } from 'vitest'
import {
  initialState,
  reducer,
  resultMessage,
  type Action,
  type GameState,
} from './game.ts'
import { shipCells, SHIPS, type PlacedShip } from './rules.ts'

// Every ship lying horizontally on its own row, starting in column 0.
function rowsFleet(firstRow = 0): PlacedShip[] {
  return SHIPS.map((ship, i) => ({
    ...ship,
    direction: 'horizontal' as const,
    cells: shipCells({ row: firstRow + i, col: 0 }, ship.size, 'horizontal'),
  }))
}

function run(state: GameState, ...actions: Action[]): GameState {
  return actions.reduce(reducer, state)
}

function inBattle(): GameState {
  return run(
    initialState(),
    { type: 'randomize', fleet: rowsFleet(0) },
    { type: 'start-battle', enemyFleet: rowsFleet(5) },
  )
}

describe('placing', () => {
  it('starts on Normal, horizontal, asking for the Carrier', () => {
    const state = initialState()
    expect(state.phase).toBe('placing')
    expect(state.difficulty).toBe('normal')
    expect(state.direction).toBe('horizontal')
    expect(state.playerMessage).toBe('Place your Carrier (5 cells).')
  })

  it('places ships in order, ignoring spots where they do not fit', () => {
    let state = run(initialState(), { type: 'place', cell: { row: 0, col: 0 } })
    expect(state.playerFleet.map((s) => s.name)).toEqual(['Carrier'])
    expect(state.playerMessage).toBe('Place your Battleship (4 cells).')
    const ignored = run(state, { type: 'place', cell: { row: 0, col: 3 } })
    expect(ignored).toBe(state)
    state = run(
      state,
      { type: 'rotate' },
      { type: 'place', cell: { row: 1, col: 9 } },
    )
    expect(state.playerFleet[1]).toMatchObject({
      name: 'Battleship',
      direction: 'vertical',
    })
  })

  it('says when the fleet is ready, and only then starts the battle', () => {
    const partial = run(initialState(), {
      type: 'place',
      cell: { row: 0, col: 0 },
    })
    expect(
      run(partial, { type: 'start-battle', enemyFleet: rowsFleet(5) }),
    ).toBe(partial)
    const ready = run(initialState(), {
      type: 'randomize',
      fleet: rowsFleet(0),
    })
    expect(ready.playerMessage).toBe('Your fleet is ready. Press Start Battle!')
    expect(
      run(ready, { type: 'start-battle', enemyFleet: rowsFleet(5) }).phase,
    ).toBe('battle')
  })

  it('lets Randomize replace ships placed by hand', () => {
    const state = run(
      initialState(),
      { type: 'place', cell: { row: 9, col: 0 } },
      { type: 'randomize', fleet: rowsFleet(0) },
    )
    expect(state.playerFleet).toEqual(rowsFleet(0))
  })

  it('locks the difficulty and direction once the battle starts', () => {
    const easy = run(initialState(), {
      type: 'set-difficulty',
      difficulty: 'easy',
    })
    expect(easy.difficulty).toBe('easy')
    const battle = inBattle()
    expect(run(battle, { type: 'set-difficulty', difficulty: 'easy' })).toBe(
      battle,
    )
    expect(run(battle, { type: 'rotate' })).toBe(battle)
  })
})

describe('battle', () => {
  it('alternates turns and ignores out-of-turn or repeated shots', () => {
    let state = run(inBattle(), {
      type: 'player-fire',
      cell: { row: 9, col: 9 },
    })
    expect(state.playerMessage).toBe('Miss!')
    expect(state.turn).toBe('enemy')
    expect(run(state, { type: 'player-fire', cell: { row: 8, col: 8 } })).toBe(
      state,
    )
    state = run(state, { type: 'enemy-fire', cell: { row: 0, col: 0 } })
    expect(state.enemyMessage).toBe('Enemy hit your ship!')
    expect(state.playerMessage).toBe('Miss!') // both results stay visible
    expect(state.turn).toBe('player')
    expect(run(state, { type: 'player-fire', cell: { row: 9, col: 9 } })).toBe(
      state,
    )
  })

  it('names the ship that sinks', () => {
    // The enemy's Destroyer is on row 9, columns 0-1.
    const state = run(
      inBattle(),
      { type: 'player-fire', cell: { row: 9, col: 0 } },
      { type: 'enemy-fire', cell: { row: 9, col: 9 } },
      { type: 'player-fire', cell: { row: 9, col: 1 } },
    )
    expect(state.playerMessage).toBe("You sank the enemy's Destroyer!")
  })

  it('ends when a fleet is sunk, and Restart keeps the difficulty', () => {
    let state = run(
      initialState('easy'),
      { type: 'randomize', fleet: rowsFleet(0) },
      { type: 'start-battle', enemyFleet: rowsFleet(5) },
    )
    const enemyCells = rowsFleet(5).flatMap((ship) => ship.cells)
    enemyCells.forEach((cell, i) => {
      state = run(state, { type: 'player-fire', cell })
      if (i < enemyCells.length - 1) {
        // The enemy misses: the player's ships are all on rows 0-4.
        state = run(state, {
          type: 'enemy-fire',
          cell: { row: 5 + Math.floor(i / 10), col: i % 10 },
        })
      }
    })
    expect(state.phase).toBe('over')
    expect(state.winner).toBe('player')
    expect(resultMessage(state)).toBe('You win! All enemy ships sunk!')
    const restarted = run(state, { type: 'restart' })
    expect(restarted).toEqual(initialState('easy'))
  })
})
