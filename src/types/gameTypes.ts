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
};
