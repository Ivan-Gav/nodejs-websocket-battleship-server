import WebSocket from 'ws';
import {
  createRoom,
  addUserToRoom,
  createGameSession,
  getPlayerBySocket,
  broadcastToPlayers,
  getAvailableRooms,
  getSocketByPlayerId,
  sockets,
} from './connection_manager/index.js';

import type {
  TMessage,
  TIncomingMessage,
  TOutgoingMessage,
  TPlayer,
  TPosition,
} from '../types';
import { specialJsonStringifyForThatCrookedFrontend } from '../utils/index.js';

export function handleMessage(
  ws: WebSocket,
  message: TIncomingMessage,
  player: TPlayer,
): void {
  switch (message.type) {
    case 'create_room': {
      const roomId = createRoom(player);

      // Broadcast updated rooms to everyone
      broadcastRoomList();

      break;
    }

    case 'add_user_to_room': {
      const roomId = (
        message.data as {
          indexRoom: number | string;
        }
      ).indexRoom;
      const success = addUserToRoom(String(roomId), player);

      if (!success) {
        send(ws, {
          type: 'error',
          data: 'Room full or not found',
          id: 0,
        });
        return;
      }

      const room = getAvailableRooms().find((r) => r.id === roomId);
      if (!room || room.users.length < 2) return;

      // Start a game
      const gameId = createGameSession([room.users[0], room.users[1]]);

      // Notify both players
      room.users.forEach((p, index) => {
        sendToPlayer(p.id, {
          type: 'create_game',
          data: {
            idGame: gameId,
            idPlayer: p.id,
          },
          id: 0,
        });
      });

      broadcastRoomList();
      break;
    }

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

function sendToPlayer(playerId: string, message: TOutgoingMessage) {
  const ws = getSocketByPlayerId(playerId);
  if (ws) send(ws, message);
}

function broadcastRoomList() {
  const rooms = getAvailableRooms();
  const msg: TMessage = {
    type: 'update_room',
    data: rooms.map((room) => ({
      roomId: room.id,
      roomUsers: room.users.map((p) => ({ name: p.name, index: p.id })),
    })),
    id: 0,
  };

  for (const socket of sockets.values()) {
    if (socket.readyState === socket.OPEN) {
      socket.send(specialJsonStringifyForThatCrookedFrontend(msg));
    }
  }
}
