export type TPlayer = {
  id: string;
  name: string;
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
