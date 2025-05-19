import { randomUUID } from 'crypto';
import {
  TRoom,
  TGameSession,
  TPlayer,
  TShip,
  TPlayerBoardState,
  TAttackResult,
  TPosition,
} from '../types';
import {
  getEmptyGamestate,
  getShipCells,
  getSurroundingCells,
} from './utils.js';

const rooms = new Map<string, TRoom>(); // roomId → room
const gameSessions = new Map<string, TGameSession>(); // gameId → game session
const winners = new Map<TPlayer, number>();

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
  if (!room || room.users.length >= 2 || room.users.includes(player)) {
    return false;
  }
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

// ========== Game sessions ==========

export function createGameSession(players: [TPlayer, TPlayer]): string {
  const gameId = randomUUID();
  gameSessions.set(gameId, {
    id: gameId,
    players,
    turn: players[0].id,
    state: getEmptyGamestate(players),
  });
  return gameId;
}

export function getGameSessionById(
  id: string | number,
): TGameSession | undefined {
  return gameSessions.get(String(id));
}

export function removeGameSessionOnUserExit(playerId: string) {
  for (const [gameId, game] of gameSessions) {
    if (game.players.find((p) => p.id === playerId)) {
      gameSessions.delete(gameId);
    }
  }
}

// ========== Game ==========

export function addShips({
  gameId,
  ships,
  indexPlayer,
}: {
  gameId: string | number;
  ships: TShip[];
  indexPlayer: number | string;
}) {
  const session = getGameSessionById(gameId);

  if (!session) {
    return { success: false, bothReady: false };
  }

  const newBoard: TPlayerBoardState = {
    ships,
    shotsFired: [],
    shotsReceived: [],
  };

  // add ships of the player
  gameSessions.set(String(gameId), {
    ...session,
    state: {
      ...session.state,
      playerStates: { ...session.state.playerStates, [indexPlayer]: newBoard },
    },
  });

  // check if both players added ships
  const updatedSession = getGameSessionById(gameId);

  const playerStates = updatedSession?.state.playerStates;
  if (playerStates && Object.entries(playerStates).length === 2) {
    updatedSession.state.currentTurn = updatedSession.players[0].id;
    return { success: true, bothReady: true };
  }
  return { success: true, bothReady: false };
}

// ==========================

export function applyAttack(
  gameId: string | number,
  attackerId: string | number,
  cell: TPosition,
): TAttackResult | null {
  const game = getGameSessionById(gameId);
  if (!game) {
    return null;
  }
  if (game.turn !== attackerId) {
    return null;
  }

  const [p1, p2] = game.players;
  const defenderId = p1.id === attackerId ? p2.id : p1.id;

  const attacker = game.state.playerStates[attackerId];
  const defender = game.state.playerStates[defenderId];

  // Prevent duplicate shots
  if (attacker.shotsFired.some((c) => c.x === cell.x && c.y === cell.y)) {
    return null;
  }

  attacker.shotsFired.push(cell);
  defender.shotsReceived.push(cell);

  const hitShip = defender.ships.find((ship) =>
    getShipCells(ship).some((s) => s.x === cell.x && s.y === cell.y),
  );

  let status: 'miss' | 'shot' | 'killed' = 'miss';
  let surroundingMisses: TPosition[] = [];

  if (hitShip) {
    const alreadyHit = hitShip.hitCells?.some(
      (c) => c.x === cell.x && c.y === cell.y,
    );
    if (!alreadyHit) {
      if (hitShip.hitCells) {
        hitShip.hitCells.push(cell);
      } else {
        hitShip.hitCells = [cell];
      }
    }

    const shipCells = getShipCells(hitShip);
    const isSunk = shipCells.every((sc) =>
      hitShip.hitCells?.some((hc) => hc.x === sc.x && hc.y === sc.y),
    );

    if (isSunk) {
      status = 'killed';
      surroundingMisses = getSurroundingCells(shipCells).filter(
        (surCell) =>
          !attacker.shotsFired.some(
            (s) => s.x === surCell.x && s.y === surCell.y,
          ),
      );

      for (const sCell of surroundingMisses) {
        attacker.shotsFired.push(sCell);
        defender.shotsReceived.push(sCell);
      }
    } else {
      status = 'shot';
    }
  }

  // Check for winner
  const defenderLost = defender.ships.every((ship) =>
    getShipCells(ship).every((sc) =>
      ship.hitCells?.some((hc) => hc.x === sc.x && hc.y === sc.y),
    ),
  );

  if (defenderLost) {
    game.state.winnerId = attackerId;
  }

  // set next turn
  if (hitShip) {
    game.turn = attackerId;
  } else {
    game.turn = defenderId;
  }

  return {
    targetCell: cell,
    status,
    surroundingMisses,
    winnerId: defenderLost ? attackerId : undefined,
  };
}

// ==========================

export function updateWinners(winner: TPlayer) {
  const savedWins = winners.get(winner);
  winner.wins += 1;

  winners.set(winner, winner.wins);

  return Array.from(winners)
    .sort((a, b) => b[1] - a[1])
    .map(([player, wins]) => ({ name: player.name, wins }));
}
