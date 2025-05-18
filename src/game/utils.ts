import { TGameState, TPlayer } from '../types';

export const getEmptyGamestate = ([
  player1,
  player2,
]: TPlayer[]): TGameState => ({
  playerStates: {},
  currentTurn: player1.id,
});
