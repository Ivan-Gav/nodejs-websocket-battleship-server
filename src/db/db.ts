import { TPlayer } from '../types';

const users: TPlayer[] = [];
let nextUserId = 1;
// TODO uuid

export const db = {
  // ---------- users ----------
  createUser: (name: string, password: string) => {
    const newUser: TPlayer = {
      id: String(nextUserId++),
      name,
      password,
      wins: 0,
    };

    users.push(newUser);
    return newUser;
  },

  getUserById: (id: string) => users.find((user) => user.id === id),

  getUserByLoginAndPassword: (name: string, password: string) => {
    const match = users.find(
      (user) => user.name === name && user.password === password,
    );
    const conflict = users.find(
      (user) => user.name === name && user.password !== password,
    );

    return { match, conflict };
  },

  getAllUsers: () => users,
};
