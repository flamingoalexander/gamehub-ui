import type { CurrentUserResponse, OpponentInfo } from "../../ticTacToeApi";

export type Mode = "menu" | "local-pvp" | "local-bot" | "online";

/**
 * Фазы онлайн-игры согласно схеме:
 *
 * "searching"  — Шаг 1: отправили POST /game_start/, ждём ответа
 * "waiting"    — Шаг 4 (ветка "создать лобби"): лобби создано, ждём WS found_opponent
 * "joining"    — Шаг 4 (ветка "присоединиться"): нашли открытое лобби, подключаемся
 * "rejoining"  — Шаг 3 (rejoin): возвращаемся в свою незавершённую игру
 * "playing"    — Шаги 5–7: активная игра (ход / ожидание хода соперника)
 * "finished"   — Шаг 8: игра завершена
 */
export type OnlinePhase =
  | "searching"
  | "waiting"
  | "joining"
  | "rejoining"
  | "playing"
  | "finished";

export type OnlineBoard = (number | null)[][];

export type { CurrentUserResponse, OpponentInfo };
