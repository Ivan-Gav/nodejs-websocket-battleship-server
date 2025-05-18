import { WebSocket } from 'ws';
import {
  addConnection,
  removeConnection,
  getPlayerBySocket,
} from './connectionHandlers.js';
import { handleMessage } from '../messageHandler.js';
import {
  specialJsonStringifyForThatCrookedFrontend,
  spreialJsonParseForThatCrookedFrontend,
} from '../../utils/index.js';
import { registerOrLogin } from '../../auth/index.js';

export function handleConnection(ws: WebSocket) {
  // You wait for a registration message first
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
    handleMessage(ws, parsed, player); // <- Your message handler
  });

  ws.on('close', () => {
    const player = getPlayerBySocket(ws);
    if (player) {
      console.log(`Player disconnected: ${player.name} (${player.id})`);
    }
    removeConnection(ws); // <- Clean up all state
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
