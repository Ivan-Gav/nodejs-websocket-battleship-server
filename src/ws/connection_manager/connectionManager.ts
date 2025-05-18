import { WebSocket } from 'ws';
import {
  addConnection,
  removeConnection,
  getPlayerBySocket,
  // sendToPlayer,
} from './connectionHandlers.js';
import {
  createRoomListMessage,
  handleMessage,
  sendToPlayer,
} from '../messageHandler.js';
import {
  specialJsonStringifyForThatCrookedFrontend,
  spreialJsonParseForThatCrookedFrontend,
} from '../../utils/index.js';
import { registerOrLogin } from '../../auth/index.js';

export function handleConnection(ws: WebSocket) {
  // Wait for a registration message first
  ws.on('message', (msg) => {
    const raw = msg.toString();
    const parsed = spreialJsonParseForThatCrookedFrontend(raw);

    if (parsed.type === 'reg') {
      const { name, password } = parsed.data;

      const player = registerOrLogin(name, password);

      ws.send(
        specialJsonStringifyForThatCrookedFrontend({
          type: 'reg',
          data: {
            name,
            index: player.user?.id ?? '',
            error: !player.success,
            errorText: player.errorText ?? '',
          },
          id: 0,
        }),
      );

      if (player.success && player.user) {
        addConnection(ws, player.user);
        sendToPlayer(player.user.id, createRoomListMessage());
        console.log(`Player connected: ${name} (${player.user.id})`);
      }
      return;
    }

    // After registration, delegate to message handler
    const player = getPlayerBySocket(ws);
    console.log('getPlayerBySocket returned: ', player);
    if (!player) {
      ws.send(
        specialJsonStringifyForThatCrookedFrontend({
          type: 'error',
          data: 'Player not registered',
          id: parsed.id,
        }),
      );
      return;
    }

    // Main dispatcher
    handleMessage(ws, parsed, player);
  });

  ws.on('close', () => {
    const player = getPlayerBySocket(ws);
    if (player) {
      console.log(`Player disconnected: ${player.name} (${player.id})`);
    }
    //TODO check cleanup
    removeConnection(ws);
  });

  // Optional welcome
  // ws.send(
  //   JSON.stringify({
  //     type: 'welcome',
  //     data: 'Connected to Battleship server',
  //     id: 0,
  //   }),
  // );
}
