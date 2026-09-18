// Battleship game flow as a pure reducer. The component supplies anything
// random (fleets, the enemy's target) through actions, and handles the
// enemy's thinking pause.
import {
  allSunk,
  canPlace,
  fire,
  hasShot,
  nextShip,
  placeShip,
  type Cell,
  type Direction,
  type PlacedShip,
  type Shot,
} from './rules.ts'

export type Difficulty = 'easy' | 'normal'
export type Phase = 'placing' | 'battle' | 'over'

export interface GameState {
  phase: Phase
  difficulty: Difficulty
  /** Direction for the next ship placed. */
  direction: Direction
  playerFleet: PlacedShip[]
  enemyFleet: PlacedShip[]
  /** The player's shots at the enemy's board. */
  playerShots: Shot[]
  /** The enemy's shots at the player's board. */
  enemyShots: Shot[]
  turn: 'player' | 'enemy'
  /** Latest result of each side's shot, shown one above the other. */
  playerMessage: string
  enemyMessage: string
  winner: 'player' | 'enemy' | null
}

export type Action =
  | { type: 'rotate' }
  | { type: 'set-difficulty'; difficulty: Difficulty }
  | { type: 'place'; cell: Cell }
  | { type: 'randomize'; fleet: PlacedShip[] }
  | { type: 'start-battle'; enemyFleet: PlacedShip[] }
  | { type: 'player-fire'; cell: Cell }
  | { type: 'enemy-fire'; cell: Cell }
  | { type: 'restart' }

/** How long the enemy "thinks" before firing, in ms. */
export const ENEMY_DELAY_MS = 800

export function placingMessage(fleet: PlacedShip[]): string {
  const ship = nextShip(fleet)
  return ship
    ? `Place your ${ship.name} (${ship.size} cells).`
    : 'Your fleet is ready. Press Start Battle!'
}

export function initialState(difficulty: Difficulty = 'normal'): GameState {
  return {
    phase: 'placing',
    difficulty,
    direction: 'horizontal',
    playerFleet: [],
    enemyFleet: [],
    playerShots: [],
    enemyShots: [],
    turn: 'player',
    playerMessage: placingMessage([]),
    enemyMessage: '',
    winner: null,
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'rotate':
      if (state.phase !== 'placing') return state
      return {
        ...state,
        direction: state.direction === 'horizontal' ? 'vertical' : 'horizontal',
      }

    case 'set-difficulty':
      // Locked once the battle starts.
      if (state.phase !== 'placing') return state
      return { ...state, difficulty: action.difficulty }

    case 'place': {
      const ship = nextShip(state.playerFleet)
      if (
        state.phase !== 'placing' ||
        !ship ||
        !canPlace(state.playerFleet, ship.size, action.cell, state.direction)
      ) {
        return state
      }
      const playerFleet = placeShip(
        state.playerFleet,
        action.cell,
        state.direction,
      )
      return {
        ...state,
        playerFleet,
        playerMessage: placingMessage(playerFleet),
      }
    }

    case 'randomize':
      if (state.phase !== 'placing') return state
      return {
        ...state,
        playerFleet: action.fleet,
        playerMessage: placingMessage(action.fleet),
      }

    case 'start-battle':
      if (state.phase !== 'placing' || nextShip(state.playerFleet)) return state
      return {
        ...state,
        phase: 'battle',
        enemyFleet: action.enemyFleet,
        turn: 'player',
        playerMessage: 'Your turn! Click a cell on the enemy board.',
        enemyMessage: '',
      }

    case 'player-fire': {
      if (
        state.phase !== 'battle' ||
        state.turn !== 'player' ||
        hasShot(state.playerShots, action.cell)
      ) {
        return state
      }
      const { shot, sunk } = fire(
        state.enemyFleet,
        state.playerShots,
        action.cell,
      )
      const playerShots = [...state.playerShots, shot]
      const playerMessage = sunk
        ? `You sank the enemy's ${sunk.name}!`
        : shot.result === 'hit'
          ? 'Hit!'
          : 'Miss!'
      if (allSunk(state.enemyFleet, playerShots)) {
        return {
          ...state,
          phase: 'over',
          playerShots,
          playerMessage,
          winner: 'player',
        }
      }
      return { ...state, playerShots, playerMessage, turn: 'enemy' }
    }

    case 'enemy-fire': {
      if (
        state.phase !== 'battle' ||
        state.turn !== 'enemy' ||
        hasShot(state.enemyShots, action.cell)
      ) {
        return state
      }
      const { shot, sunk } = fire(
        state.playerFleet,
        state.enemyShots,
        action.cell,
      )
      const enemyShots = [...state.enemyShots, shot]
      const enemyMessage = sunk
        ? `Enemy sank your ${sunk.name}!`
        : shot.result === 'hit'
          ? 'Enemy hit your ship!'
          : 'Enemy missed!'
      if (allSunk(state.playerFleet, enemyShots)) {
        return {
          ...state,
          phase: 'over',
          enemyShots,
          enemyMessage,
          winner: 'enemy',
        }
      }
      return { ...state, enemyShots, enemyMessage, turn: 'player' }
    }

    case 'restart':
      return initialState(state.difficulty)
  }
}

export function resultMessage(state: GameState): string | null {
  if (state.winner === 'player') return 'You win! All enemy ships sunk!'
  if (state.winner === 'enemy') return 'You lose! All your ships sunk!'
  return null
}
