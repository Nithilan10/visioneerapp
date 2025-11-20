import {v4 as uuidv4} from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

const sessions = new Map<string, Session>();

export function generateToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

export function createSession(userId: string, expiresInHours: number = 24): Session {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  
  const session: Session = {
    userId,
    token,
    expiresAt
  };
  
  sessions.set(token, session);
  return session;
}

export function validateToken(token: string): Session | null {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

export function revokeToken(token: string): boolean {
  return sessions.delete(token);
}

export function revokeAllUserSessions(userId: string): number {
  let count = 0;
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
      count++;
    }
  }
  return count;
}

export function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

