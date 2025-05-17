type TMessageType =
  | 'reg'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'create_game'
  | 'update_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'randomAttack'
  | 'turn'
  | 'finish';

type TPosition = {
  x: number;
  y: number;
};

type TShipType = 'small' | 'medium' | 'large' | 'huge';

type TShip = {
  position: TPosition;
  direction: boolean;
  length: number;
  type: TShipType;
};

interface MessageDataMap {
  reg:
    | {
        name: string;
        password: string;
      }
    | {
        name: string;
        index: number | string;
        error: boolean;
        errorText: string;
      };

  update_winners: {
    name: string;
    wins: number;
  }[];

  create_room: '';

  add_user_to_room: {
    indexRoom: number | string;
  };

  create_game: {
    idGame: number | string;
    idPlayer: number | string;
  };

  update_room: {
    roomId: number | string;
    roomUsers: {
      name: string;
      index: number | string;
    }[];
  }[];

  add_ships: {
    gameId: number | string;
    ships: TShip[];
    indexPlayer: number | string;
  };

  start_game: {
    ships: TShip[];
    currentPlayerIndex: number | string;
  };

  attack:
    | {
        gameId: number | string;
        x: number;
        y: number;
        indexPlayer: number | string;
      }
    | {
        position: TPosition;
        currentPlayer: number | string;
        status: 'miss' | 'killed' | 'shot';
      };

  randomAttack: {
    gameId: number | string;
    indexPlayer: number | string;
  };

  turn: {
    currentPlayer: number | string;
  };

  finish: {
    winPlayer: number | string;
  };
}

export type TMessage<T extends TMessageType = TMessageType> = {
  type: T;
  data: MessageDataMap[T];
  id: 0;
};

export type TIncomingMessage = TMessage<
  | 'reg'
  | 'create_room'
  | 'add_user_to_room'
  | 'add_ships'
  | 'attack'
  | 'randomAttack'
>;

export type TOutgoingMessage = TMessage<
  | 'reg'
  | 'update_winners'
  | 'create_game'
  | 'update_room'
  | 'start_game'
  | 'attack'
  | 'turn'
  | 'finish'
>;
