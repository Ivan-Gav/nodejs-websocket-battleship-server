import { TGameState, TPlayer, TPosition, TShip } from '../types';

export function getEmptyGamestate([player1, player2]: TPlayer[]): TGameState {
  return {
    playerStates: {},
    currentTurn: player1.id,
  };
}

export function getShipCells(ship: TShip): TPosition[] {
  const cells: TPosition[] = [];
  for (let i = 0; i < ship.length; i++) {
    cells.push({
      x: ship.position.x + (ship.direction ? 0 : i),
      y: ship.position.y + (ship.direction ? i : 0),
    });
  }
  return cells;
}

export function getSurroundingCells(shipCells: TPosition[]): TPosition[] {
  const surrounding = new Set<string>();
  for (const { x, y } of shipCells) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        surrounding.add(`${nx},${ny}`);
      }
    }
  }
  for (const cell of shipCells) {
    surrounding.delete(`${cell.x},${cell.y}`); // remove actual ship cells
  }
  return Array.from(surrounding).map((str) => {
    const [x, y] = str.split(',').map(Number);
    return { x, y };
  });
}

export function getRandomPosition(shotsFired: TPosition[]): TPosition | null {
  const allPositions: TPosition[] = [];

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      allPositions.push({ x, y });
    }
  }

  const remainingPositions = allPositions.filter(
    (pos) => !shotsFired.some((shot) => shot.x === pos.x && shot.y === pos.y),
  );

  if (remainingPositions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * remainingPositions.length);
  return remainingPositions[randomIndex];
}
