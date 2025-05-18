import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

import type {
  TPlayer,
  TRoom,
  TGameSession,
  TOutgoingMessage,
} from '../../types';
import { specialJsonStringifyForThatCrookedFrontend } from '../../utils/index.js';
import {
  removeGameSessionOnUserExit,
  removeRoomOnUserExit,
} from '../../game/game.js';

// ========== State ==========

export const sockets = new Map<string, WebSocket>(); // playerId → socket
const players = new Map<WebSocket, TPlayer>(); // socket → player

// ===========================

export function addConnection(ws: WebSocket, user: TPlayer): void {
  sockets.set(user.id, ws);
  players.set(ws, user);
}

export function removeConnection(ws: WebSocket): void {
  const player = players.get(ws);
  if (!player) return;

  players.delete(ws);
  sockets.delete(player.id);
  removeRoomOnUserExit(player.id);
  removeGameSessionOnUserExit(player.id);
}

export function getPlayerBySocket(ws: WebSocket): TPlayer | undefined {
  return players.get(ws);
}

export function getSocketByPlayerId(id: string): WebSocket | undefined {
  return sockets.get(id);
}
