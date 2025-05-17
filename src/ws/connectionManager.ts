import { WebSocket } from 'ws';

export function handleConnection(ws: WebSocket) {
  ws.on('message', (msg) => {
    console.log('Received:', msg.toString());
  });

  ws.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Connected to Battleship server',
    }),
  );
}
