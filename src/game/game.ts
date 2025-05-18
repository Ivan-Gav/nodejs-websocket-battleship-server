import { randomUUID } from 'crypto';
import {
  TRoom,
  TGameSession,
  TPlayer,
  TShip,
  TPlayerBoardState,
} from '../types';
import { getEmptyGamestate } from './utils.js';

const rooms = new Map<string, TRoom>(); // roomId → room
const gameSessions = new Map<string, TGameSession>(); // gameId → game session

// ========== Rooms ==========

export function createRoom(host: TPlayer): string {
  const roomId = randomUUID();
  rooms.set(roomId, { id: roomId, users: [host] });
  return roomId;
}

export function getRoomById(roomId: string): TRoom | undefined {
  return rooms.get(roomId);
}

export function addUserToRoom(roomId: string, player: TPlayer): boolean {
  const room = rooms.get(roomId);
  if (!room || room.users.length >= 2) return false;
  room.users.push(player);
  return true;
}

export function removeRoomOnUserExit(playerId: string) {
  for (const [roomId, room] of rooms) {
    if (room.users.find((p) => p.id === playerId)) {
      rooms.delete(roomId);
    }
  }
}

export function getAvailableRooms(): TRoom[] {
  return Array.from(rooms.values()).filter((room) => room.users.length === 1);
}

export function removeRoom(roomId: string): void {
  rooms.delete(roomId);
}

// ========== Game sessions ==========

export function createGameSession(players: [TPlayer, TPlayer]): string {
  const gameId = randomUUID();
  gameSessions.set(gameId, {
    id: gameId,
    players,
    turn: players[0].id,
    state: getEmptyGamestate(players),
  });
  return gameId;
}

export function getGameSessionById(id: string): TGameSession | undefined {
  return gameSessions.get(id);
}

export function removeGameSessionOnUserExit(playerId: string) {
  for (const [gameId, game] of gameSessions) {
    if (game.players.find((p) => p.id === playerId)) {
      gameSessions.delete(gameId);
    }
  }
}

// ========== Game ==========

export function addShips({
  gameId,
  ships,
  indexPlayer,
}: {
  gameId: string;
  ships: TShip[];
  indexPlayer: number | string;
}) {
  const session = getGameSessionById(gameId);

  if (!session) {
    return { success: false, bothReady: false };
  }

  const newBoard: TPlayerBoardState = {
    ships,
    shotsFired: [],
    shotsReceived: [],
  };

  // add ships of the player
  gameSessions.set(gameId, {
    ...session,
    state: {
      ...session.state,
      playerStates: { ...session.state.playerStates, [indexPlayer]: newBoard },
    },
  });

  // check if both players added ships
  const updatedSession = getGameSessionById(gameId);
  console.log('updated session => ', updatedSession);

  const playerStates = updatedSession?.state.playerStates;
  if (playerStates && Object.entries(playerStates).length === 2) {
    return { success: true, bothReady: true };
  }
  return { success: true, bothReady: false };
}
