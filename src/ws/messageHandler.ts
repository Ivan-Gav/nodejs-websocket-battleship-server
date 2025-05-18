import WebSocket from 'ws';
import { getSocketByPlayerId, sockets } from './connection_manager/index.js';

import type {
  TIncomingMessage,
  TOutgoingMessage,
  TPlayer,
  TPosition,
} from '../types';
import { specialJsonStringifyForThatCrookedFrontend } from '../utils/index.js';
import {
  createRoom,
  addUserToRoom,
  getAvailableRooms,
  createGameSession,
  getRoomById,
} from '../game/game.js';

export function handleMessage(
  ws: WebSocket,
  message: TIncomingMessage,
  player: TPlayer,
): void {
  switch (message.type) {
    case 'create_room': {
      createRoom(player);
      broadcastRoomList();
      break;
    }
    //------------------------------
    case 'add_user_to_room': {
      const roomId = (
        message.data as {
          indexRoom: number | string;
        }
      ).indexRoom.toString();

      const success = addUserToRoom(roomId, player);
      console.log(
        `user ${player.name} added to room ${roomId} success: ${success}`,
      );

      if (!success) {
        send(ws, {
          type: 'error',
          data: 'Room full or not found',
          id: 0,
        });
        return;
      }

      const room = getRoomById(roomId);
      if (!room || room.users.length < 2) return;

      // Start a game
      const gameId = createGameSession([room.users[0], room.users[1]]);

      // Notify both players
      room.users.forEach((player) => {
        sendToPlayer(player.id, {
          type: 'create_game',
          data: {
            idGame: gameId,
            idPlayer: player.id,
          },
          id: 0,
        });
      });

      broadcastRoomList();
      break;
    }
    //------------------------------
    case 'randomAttack':
    case 'attack': {
      // Here you would look up the game state, validate turn, apply hit logic
      // For now just echo back a mock attack result
      send(ws, {
        type: 'attack',
        data: {
          position: {
            x: (message.data as TPosition).x,
            y: (message.data as TPosition).y,
          },
          currentPlayer: player.id,
          status: 'miss',
        },
        id: 0,
      });
      break;
    }

    case 'add_ships': {
      // Store ships in game session object, and when both players have sent them,
      // trigger `start_game`
      // (You’d need game state and ship tracking to be implemented.)
      break;
    }

    // case 'finish': {
    //   // Notify both players and clean up game
    //   break;
    // }

    default: {
      send(ws, {
        type: 'error',
        data: `Unknown message type: ${message.type}`,
        id: 0,
      });
    }
  }
}

function send(ws: WebSocket, message: TOutgoingMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(specialJsonStringifyForThatCrookedFrontend(message));
  }
}

export function sendToPlayer(playerId: string, message: TOutgoingMessage) {
  const ws = getSocketByPlayerId(playerId);
  if (ws) send(ws, message);
}

export function createRoomListMessage(): TOutgoingMessage {
  const rooms = getAvailableRooms();
  return {
    type: 'update_room',
    data: rooms.map((room) => ({
      roomId: room.id,
      roomUsers: room.users.map((p) => ({ name: p.name, index: p.id })),
    })),
    id: 0,
  };
}

export function broadcastToPlayers(
  playerIds: string[],
  msg: TOutgoingMessage,
): void {
  for (const id of playerIds) {
    sendToPlayer(id, msg);
  }
}

function broadcastRoomList() {
  for (const socket of sockets.values()) {
    if (socket.readyState === socket.OPEN) {
      socket.send(
        specialJsonStringifyForThatCrookedFrontend(createRoomListMessage()),
      );
    }
  }
}
