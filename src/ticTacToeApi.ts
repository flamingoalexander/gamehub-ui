const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";
const WS_BASE  = process.env.REACT_APP_WS_URL  ?? "ws://localhost:8000";

export interface OpponentInfo {
  id: number;
  email: string;
  avatar: string | null;
}

export interface GameStartResponse {
  status: "created" | "joined" | "rejoined";
  lobby_id: number;
  map: (number | null)[][];
  board_size: number;
  win_length: number;
  is_your_turn: boolean | null;
  is_owner: boolean;
  opponent: OpponentInfo | null;
}

export interface MakeTurnResponse {
  status: "ok";
  map: (number | null)[][];
  timestamp: number;
  game_over: boolean | null;
  winner: number | null;
}

export interface CurrentUserResponse {
  id: number;
  email: string;
  avatar: string | null;
  created_at: string;
}

export interface WsFoundOpponent {
  type: "found_opponent";
  opponent: OpponentInfo;
  is_your_turn: boolean;
  map: (number | null)[][] | null;
  board_size: number;
  win_length: number;
}

export interface WsGetTurn {
  type: "get_turn";
  row: number;
  col: number;
  map: (number | null)[][];
  is_your_turn: boolean;
  game_over: boolean | null;
  winner: number | null;
  timestamp: number;
}

export interface WsGameEnded {
  type: "game_ended";
  winner: number | null;
  map: (number | null)[][];
}

export interface WsLobbyState {
  type: "lobby_state";
  lobby_id: number;
  map: (number | null)[][];
  is_your_turn: boolean;
}

export type WsMessage = WsFoundOpponent | WsGetTurn | WsGameEnded | WsLobbyState;

function getToken(): string {
  return localStorage.getItem("accesstoken") ?? "";
}

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

export function gameStart(boardSize: number, winLength: number): Promise<GameStartResponse> {
  return apiFetch<GameStartResponse>("/tictactoe/game_start/", {
    method: "POST",
    body: JSON.stringify({ board_size: boardSize, win_length: winLength }),
  });
}

export function makeTurn(lobbyId: number, row: number, col: number): Promise<MakeTurnResponse> {
  return apiFetch<MakeTurnResponse>("/tictactoe/make_turn/", {
    method: "POST",
    body: JSON.stringify({ lobby_id: lobbyId, row, col }),
  });
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>("/tictactoe/me/");
}

export type WsEventHandler = (msg: WsMessage) => void;

export class TicTacToeSocket {
  private ws: WebSocket | null = null;

  constructor(
    private lobbyId: number,
    private endpoint: "found_opponent" | "get_turn",
    private onMessage: WsEventHandler,
    private onClose?: () => void
  ) {}

  connect(): void {
    const token = getToken();
    const url = `${WS_BASE}/ws/tictactoe/${this.lobbyId}/${this.endpoint}/?token=${token}`;
    this.ws = new WebSocket(url);
    this.ws.onmessage = (e) => {
      try { this.onMessage(JSON.parse(e.data)); } catch {}
    };
    this.ws.onclose = () => this.onClose?.();
    this.ws.onerror = (e) => console.error("WS error", e);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}

export function deleteLobby(lobbyId: number): Promise<{ status: string }> {
  return apiFetch(`/tictactoe/delete_lobby/`, {
    method: "DELETE",
    body: JSON.stringify({ lobby_id: lobbyId }),
  });
}