import { db } from '../db/db.js';
import { TPlayer } from '../types';

export function registerOrLogin(
  name: string,
  password: string,
): {
  success: boolean;
  errorText?: string;
  user?: TPlayer;
} {
  const { match, conflict } = db.getUserByLoginAndPassword(name, password);

  // First try to find exact match (name + password)
  if (match) {
    return { success: true, user: match };
  }

  // If name exists with different password, reject
  if (conflict) {
    return {
      success: false,
      errorText: 'Login is already used with another password',
    };
  }

  // Otherwise register a new user
  const newUser = db.createUser(name, password);
  return { success: true, user: newUser };
}
