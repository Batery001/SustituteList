export interface SessionStore {
  name: string;
}

export interface SessionPlayer {
  playerName: string;
}

export interface AppSession {
  store: SessionStore | null;
  player: SessionPlayer | null;
}
