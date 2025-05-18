import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

import type {
  TPlayer,
  TRoom,
  TGameSession,
  TOutgoingMessage,
} from '../../types';
import { specialJsonStringifyForThatCrookedFrontend } from '../../utils/index.js';

// ========== State ==========

export const sockets = new Map<string, WebSocket>(); // playerId → socket
const players = new Map<WebSocket, TPlayer>(); // socket → player

const rooms = new Map<string, TRoom>(); // roomId → room
const games = new Map<string, TGameSession>(); // gameId → game session

// ========== TPlayer & Connection ==========

export function addConnection(ws: WebSocket, user: TPlayer): void {
  sockets.set(user.id, ws);
  players.set(ws, user);
}

export function removeConnection(ws: WebSocket): void {
  const player = players.get(ws);
  if (!player) return;

  players.delete(ws);
  sockets.delete(player.id);

  // Remove from rooms or games if needed
  for (const [roomId, room] of rooms) {
    if (room.users.find((p) => p.id === player.id)) {
      rooms.delete(roomId);
    }
  }

  for (const [gameId, game] of games) {
    if (game.players.find((p) => p.id === player.id)) {
      games.delete(gameId);
    }
  }
}

export function getPlayerBySocket(ws: WebSocket): TPlayer | undefined {
  return players.get(ws);
}

export function getSocketByPlayerId(id: string): WebSocket | undefined {
  return sockets.get(id);
}

// ========== Rooms ==========

export function createRoom(host: TPlayer): string {
  const roomId = randomUUID();
  rooms.set(roomId, { id: roomId, users: [host] });
  return roomId;
}

export function addUserToRoom(roomId: string, player: TPlayer): boolean {
  const room = rooms.get(roomId);
  if (!room || room.users.length >= 2) return false;
  room.users.push(player);
  return true;
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

// ========== Messaging ==========

export function sendToPlayer(playerId: string, msg: TOutgoingMessage): void {
  const ws = sockets.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(specialJsonStringifyForThatCrookedFrontend(msg));
  }
}

export function broadcastToPlayers(
  playerIds: string[],
  msg: TOutgoingMessage,
): void {
  for (const id of playerIds) {
    sendToPlayer(id, msg);
  }
}
