import WebSocket from 'ws';
import { getSocketByPlayerId, sockets } from './connection_manager/index.js';

import type {
  MessageDataMap,
  TGameSession,
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
  addShips,
  getGameSessionById,
  applyAttack,
  updateWinners,
} from '../game/game.js';
import { getRandomPosition } from '../game/utils.js';

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
    case 'add_ships': {
      const { gameId, ships, indexPlayer } =
        message.data as unknown as MessageDataMap['add_ships'];
      const response = addShips({
        gameId: gameId,
        indexPlayer: indexPlayer,
        ships,
      });

      if (response.bothReady) {
        const startMesages = createStartGameMessages(gameId);
        Object.entries(startMesages).forEach(([playerId, messages]) => {
          sendToPlayer(playerId, messages[0]);
          sendToPlayer(playerId, messages[1]);
        });
      }
      break;
    }

    //------------------------------
    case 'randomAttack': {
      const { gameId, indexPlayer } = message.data as unknown as {
        gameId: number | string;
        indexPlayer: number | string;
      };
      const session = getGameSessionById(gameId);
      if (!session) {
        return;
      }
      const { players, state } = session;

      const { shotsFired } = state.playerStates[indexPlayer];
      const randomPosition = getRandomPosition(shotsFired);

      if (!randomPosition) {
        return;
      }

      const { x, y } = randomPosition;

      handleAttack({ gameId, x, y, indexPlayer });

      break;
    }

    case 'attack': {
      const data = message.data as unknown as {
        gameId: number | string;
        x: number;
        y: number;
        indexPlayer: number | string;
      };

      handleAttack(data);

      break;
    }

    //------------------------------

    default: {
      send(ws, {
        type: 'error',
        data: `Unknown message type: ${message.type}`,
        id: 0,
      });
    }
  }
}

//--------- HANDLE ATTACK ---------------------

function handleAttack({
  gameId,
  x,
  y,
  indexPlayer,
}: {
  gameId: number | string;
  x: number;
  y: number;
  indexPlayer: number | string;
}) {
  const result = applyAttack(gameId, indexPlayer, { x, y });
  const session = getGameSessionById(gameId);

  if (!result || !session) return;

  const { players, turn } = session;

  players.forEach((player) => {
    // Send primary shot feedback
    sendToPlayer(player.id, {
      type: 'attack',
      data: {
        position: result.targetCell,
        currentPlayer: indexPlayer,
        status: result.status,
      },
      id: 0,
    });
    // Send automatic surrounding misses if ship was killed
    if (result.status === 'killed' && result.surroundingMisses.length > 0) {
      for (const missedCell of result.surroundingMisses) {
        sendToPlayer(player.id, {
          type: 'attack',
          data: {
            position: missedCell,
            currentPlayer: indexPlayer,
            status: 'miss',
          },
          id: 0,
        });
      }
    }
    // Send turn
    sendToPlayer(player.id, {
      type: 'turn',
      data: {
        currentPlayer: turn,
      },
      id: 0,
    });
  });

  // Notify players of game over
  if (result.winnerId) {
    players.forEach((player) => {
      sendToPlayer(player.id, {
        type: 'finish',
        data: {
          winPlayer: result.winnerId!,
        },
        id: 0,
      });
    });

    const winner = players.find((player) => player.id === result.winnerId);
    const winners = updateWinners(winner!);
    broadcastToAllPlayers({ type: 'update_winners', data: winners, id: 0 });
  }
}

//------------------------------

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

export function createStartGameMessages(gameId: string | number) {
  const { state } = getGameSessionById(gameId) as TGameSession;

  const messages: Record<string, TOutgoingMessage[]> = {};

  Object.entries(state.playerStates).forEach(([playerId, playerState]) => {
    const starData: MessageDataMap['start_game'] = {
      ships: playerState.ships,
      currentPlayerIndex: playerId,
    };

    const turnData: MessageDataMap['turn'] = {
      currentPlayer: getGameSessionById(String(gameId))?.turn || playerId,
    };

    messages[playerId] = [{ type: 'start_game', id: 0, data: starData }];
    messages[playerId].push({
      type: 'turn',
      id: 0,
      data: turnData,
    });
  });

  return messages;
}

export function broadcastToPlayers(
  playerIds: string[],
  msg: TOutgoingMessage,
): void {
  for (const id of playerIds) {
    sendToPlayer(id, msg);
  }
}

function broadcastToAllPlayers(msg: TOutgoingMessage) {
  for (const socket of sockets.values()) {
    if (socket.readyState === socket.OPEN) {
      socket.send(specialJsonStringifyForThatCrookedFrontend(msg));
    }
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
