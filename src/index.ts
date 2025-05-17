import http from 'node:http';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { handleConnection } from './ws/connectionManager.js';

dotenv.config();

const WS_PORT = parseInt(process.env.WS_PORT || '3000', 10);

const server = http.createServer();

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  console.log(`New client connected from ${req.socket.remoteAddress}`);
  handleConnection(ws);
});

server.listen(WS_PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
});
