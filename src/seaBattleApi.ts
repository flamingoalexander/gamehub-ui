const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";
const WS_BASE  = process.env.REACT_APP_WS_URL  ?? "ws://localhost:8000";

export const SEA_SIZE = 8;
export const SHIP_LENGTHS = [4, 3, 2, 2, 1];

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type Cell = null | 0 | 1 | 2;
export type Field = Cell[][];

export interface UserInfo {
  id: number;
  email: string;
  avatar: string | null;
}

export interface LobbyState {
  lobby_id: number;
  is_owner: boolean;
  my_ships: Field;
  my_shots: Field;
  enemy_view: Field;
  my_ready: boolean;
  enemy_ready: boolean;
  is_your_turn: boolean;
  opponent: UserInfo | null;
  winner: number | null;
}

export interface GameStartResponse extends LobbyState {
  status: "created" | "joined" | "rejoined";
  turn_deadline: number | null; // unix timestamp (секунды) — дедлайн текущего хода
}

export interface PlaceShipsResponse {
  status: "ok";
  both_ready: boolean;
  is_your_turn: boolean;
}

export interface ShootResponse {
  status: "ok";
  hit: boolean;
  game_over: boolean;
  winner: number | null;
  is_your_turn: boolean;
  timestamp: number;
}

// WebSocket события
export type WsOpponentJoined = { type: "opponent_joined"; opponent: UserInfo };
export type WsPlayerReady    = { type: "player_ready"; user_id: number; both_ready: boolean; first_turn: number };
export type WsShot = {
  type: "shot";
  shooter_id: number;
  row: number;
  col: number;
  hit: boolean;
  game_over: boolean;
  winner: number | null;
  is_your_turn: boolean;
  timestamp: number;
};
export type WsLobbyDeleted = { type: "lobby_deleted" };
export type WsGameEnded    = { type: "game_ended"; winner: number | null; reason?: string };
export type WsMessage = WsOpponentJoined | WsPlayerReady | WsShot | WsLobbyDeleted | WsGameEnded;

// ─── API ──────────────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem("accesstoken") ?? ""; }

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const sbGameStart = () =>
  apiFetch<GameStartResponse>("/seabattle/game_start/", { method: "POST" });

export const sbPlaceShips = (lobbyId: number, ships: Field) =>
  apiFetch<PlaceShipsResponse>("/seabattle/place_ships/", {
    method: "POST",
    body: JSON.stringify({ lobby_id: lobbyId, ships }),
  });

export const sbShoot = (lobbyId: number, row: number, col: number) =>
  apiFetch<ShootResponse>("/seabattle/shoot/", {
    method: "POST",
    body: JSON.stringify({ lobby_id: lobbyId, row, col }),
  });

export const sbDeleteLobby = (lobbyId: number) =>
  apiFetch("/seabattle/delete_lobby/", {
    method: "DELETE",
    body: JSON.stringify({ lobby_id: lobbyId }),
  });

/**
 * POST /seabattle/leave_lobby/
 * Покинуть лобби. Доступно любому участнику.
 * Бэкенд удаляет лобби когда оба игрока покинули его.
 */
export const sbLeaveLobby = (lobbyId: number) =>
  apiFetch<{ status: string }>("/seabattle/leave_lobby/", {
    method: "POST",
    body: JSON.stringify({ lobby_id: lobbyId }),
  });

export const sbGetMe = () =>
  apiFetch<UserInfo>("/seabattle/me/");

/**
 * POST /seabattle/forfeit/
 * Вызывается когда таймер истёк на клиенте.
 * Сервер проверяет дедлайн, удаляет лобби и рассылает game_ended обоим игрокам.
 * Если лобби уже удалено — возвращает { status: "already_deleted" }, это не ошибка.
 */
export const sbForfeit = (lobbyId: number) =>
  apiFetch<{ status: string }>("/seabattle/forfeit/", {
    method: "POST",
    body: JSON.stringify({ lobby_id: lobbyId }),
  });

// ─── WebSocket ────────────────────────────────────────────────────────────────

export class SeaBattleSocket {
  private ws: WebSocket | null = null;

  constructor(
    private lobbyId: number,
    private onMessage: (msg: WsMessage) => void,
    private onClose?: () => void,
  ) {}

  connect() {
    const url = `${WS_BASE}/ws/seabattle/${this.lobbyId}/lobby/?token=${getToken()}`;
    this.ws = new WebSocket(url);
    this.ws.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)); } catch {}
    };
    this.ws.onclose = () => this.onClose?.();
    this.ws.onerror = (e) => console.error("SB WS error", e);
  }

  disconnect() { this.ws?.close(); this.ws = null; }
}