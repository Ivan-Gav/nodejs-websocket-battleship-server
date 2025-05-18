export type TPlayer = {
  id: string;
  name: string;
  password: string;
  wins: number;
};

export type TRoom = {
  id: string;
  users: TPlayer[];
};

export type TGameSession = {
  id: string;
  players: [TPlayer, TPlayer];
  turn: string; // playerId
  state: TGameState;
};

export type TPosition = {
  x: number;
  y: number;
};

export type TShipType = 'small' | 'medium' | 'large' | 'huge';

export type TShip = {
  position: TPosition;
  direction: boolean;
  length: number;
  type: TShipType;
  hitCells?: TPosition[];
};

export type TPlayerBoardState = {
  ships: TShip[]; // All ships
  shotsReceived: TPosition[]; // Shots from opponent
  shotsFired: TPosition[]; // Shots fired at opponent
};

export type TGameState = {
  playerStates: {
    [playerId: string]: TPlayerBoardState;
  };
  currentTurn: string; // playerId
  winnerId?: string; // playerId, if the game is over
};
