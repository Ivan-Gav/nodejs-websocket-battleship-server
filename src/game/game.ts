import { randomUUID } from 'crypto';
import { TRoom, TGameSession, TPlayer } from '../types';

const rooms = new Map<string, TRoom>(); // roomId → room
const games = new Map<string, TGameSession>(); // gameId → game session

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

// ========== Games ==========

export function createGameSession(players: [TPlayer, TPlayer]): string {
  const gameId = randomUUID();
  games.set(gameId, { id: gameId, players, turn: players[0].id });
  return gameId;
}

export function getGameById(id: string): TGameSession | undefined {
  return games.get(id);
}

export function removeGameOnUserExit(playerId: string) {
  for (const [gameId, game] of games) {
    if (game.players.find((p) => p.id === playerId)) {
      games.delete(gameId);
    }
  }
}
